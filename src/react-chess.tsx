import React, { CSSProperties, useReducer, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import defaultLineup from './defaultLineup';
import pieceComponents from './pieces';
import decode from './decode';
import { swap, moves, Board, Piece, pieceTypeByName } from './logic'

export const getDefaultLineup = () => defaultLineup.slice()
const noop = () => true;

const square = 100 / 8
const squareSize = `${square}%`

const squareStyles = {
  width: squareSize,
  paddingBottom: squareSize,
  float: 'left',
  position: 'relative',
  pointerEvents: 'none'
}

const labelStyles = { fontSize: 'calc(7px + .5vw)', position: 'absolute', userSelect: 'none' }
const yLabelStyles = Object.assign({ top: '5%', left: '5%' }, labelStyles)
const xLabelStyles = Object.assign({ bottom: '5%', right: '5%' }, labelStyles)

interface Props {
  allowMoves?: boolean;
  highlightTarget?: boolean;
  drawLabels?: boolean;
  lightSquareColor?: string;
  darkSquareColor?: string;
  onMovePiece: (d: Dragging, from: string, to: string) => void;
  onDragStart?: (d: Dragging) => boolean;
  pieces?: string[];
  whiteTurn?: boolean;
  passant?: number;
}
export interface Dragging {
  notation: string;
  name: string;
  index: number;
  position: {
    x: number;
    y: number;
  };
};

interface State {
  tileSize?: number;
  boardSize?: number;
  targetTile?: {
    x: number;
    y: number;
  };
  draggingPiece?: Dragging;
  dragFrom?: {
    x: number;
    y: number;
    pos: string;
  }
  marks?: {x:number, y:number}[],
}

const size = 600

const findPieceAtPosition = ({ pieces, pos }) => {
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]
    if (piece.indexOf(pos) === 2) {
      return { notation: piece, name: piece.slice(0, 1), index: i, position: pos }
    }
  }

  return null
}

const toPosition = ({ x, y }) => ({ x, y, pos: `${String.fromCharCode(decode.charCodeOffset + x)}${8 - y}` })

const coordsToPosition = ({ tileSize, x, y }) => toPosition({
  x: Math.round(x / tileSize),
  y: Math.round(y / tileSize),
})


const getSquareColor = ({ lightSquareColor, darkSquareColor, x, y }) => {
  const odd = x % 2

  if (y % 2) {
    return odd ? lightSquareColor : darkSquareColor
  }

  return odd ? darkSquareColor : lightSquareColor
}

function LabelText({ drawLabels, x, y }) {
  const isLeftColumn = x === 0
  const isBottomRow = y === 7

  if (!drawLabels || (!isLeftColumn && !isBottomRow)) {
    return null
  }

  if (isLeftColumn && isBottomRow) {
    return <>
      <span key="blx" style={xLabelStyles as CSSProperties}>
        a
      </span>
      <span key="bly" style={yLabelStyles as CSSProperties}>
        1
      </span>
    </>
  }

  const label = isLeftColumn ? 8 - y : String.fromCharCode(decode.charCodeOffset + x)
  return <span style={(isLeftColumn ? yLabelStyles : xLabelStyles) as CSSProperties}>{label}</span>
}

const cellStyles = ({ isTarget, lightSquareColor, darkSquareColor, x, y, isValid }) => ({
  ...squareStyles,
  background: getSquareColor({ lightSquareColor, darkSquareColor, x, y }),
  boxShadow: isTarget ? 'inset 0px 0px 0px 0.4vmin yellow' : (isValid ? 'inset 0px 0px 0px 0.4vmin green' : undefined),
})

const Tiles = ({ targetTile, lightSquareColor, darkSquareColor, drawLabels, marks }) => <>
  {Array.from({ length: 64 }, (v, i) => {
    const x = Math.floor(i % 8);
    const y = Math.floor(i / 8);

    const styles = cellStyles({
      isTarget: targetTile && targetTile.x === x && targetTile.y === y,
      lightSquareColor, darkSquareColor, x, y,
      isValid: (marks as {x:number,y:number}[] || []).findIndex(v => v.x ===x && v.y === y) !== -1
    });

    return <div key={`rect-${x}-${y}`} style={styles as CSSProperties}>
      <LabelText x={x} y={y} drawLabels={drawLabels} />
    </div>
  })}
</>

const DraggablePieces = ({ pieces, handleDragStart, handleDrag, handleDragStop, draggingPiece }) => <>
  {pieces.map((decl, i) => {
    const isMoving = draggingPiece && i === draggingPiece.index
    const { x, y, piece } = decode.fromPieceDecl(decl)
    const Piece = pieceComponents[piece]
    return <Draggable
      bounds="parent"
      defaultPosition={{ x: 0, y: 0 }}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      key={`${piece}-${x}-${y}`}>
      <Piece isMoving={isMoving} x={x} y={y} />
    </Draggable>
  })}
</>

interface MovingToAction {
  type: 'movingTo';
  data: { x: number, y: number }
}
interface PickAction {
  type: 'pick';
  data: { dragFrom: { x: number, y: number, pos: string }, draggingPiece: Dragging, whiteTurn: boolean, pieces: string[] }
}
interface DropAction {
  type: 'drop';
}
type Action = MovingToAction | PickAction | DropAction;

const translatePieces = (ps:string[], whiteTurn: boolean, exclude: string): Piece[] => ps.map( name => name === exclude ? null : ({
  x: name.codePointAt(2) - 'a'.codePointAt(0),
  y: (y => whiteTurn ? y : 7-y)(name.codePointAt(3) - '1'.codePointAt(0)),
  foe: whiteTurn === (name.charAt(0) === name.charAt(0).toLocaleLowerCase()), 
  type: pieceTypeByName(name.charAt(0))
})).filter(Boolean)

const updateState = (state: State, action: Action):State => {
  switch (action.type) {
    case 'movingTo':
      return {...state, targetTile: action.data };
    case 'pick':
      const board:Board = {
        pieces: translatePieces(action.data.pieces, action.data.whiteTurn, action.data.draggingPiece.notation),
      }

      const pieceStrategy = moves[action.data.draggingPiece.name.toLowerCase()]
      const pos = swap(action.data.dragFrom, !action.data.whiteTurn) // normal position
      const validMoves = pieceStrategy(pos)
        .map( m => m(board)).filter(Boolean)
        .map(x => swap(x,!action.data.whiteTurn)) //translate back position

      return {...state, ...action.data, marks: validMoves }
    case 'drop':
      return {...state, dragFrom: null, targetTile: null, draggingPiece: null, marks: null };
    default:
      throw new Error();
  }
}

const resetState = (size: number):State => ({
  tileSize: size / 8,
  boardSize: size
})

function Chess({
    allowMoves = true,
    highlightTarget = true,
    drawLabels = true,
    onMovePiece = noop,
    onDragStart = noop,
    whiteTurn = true,
    passant = null,
    lightSquareColor = '#f0d9b5',
    darkSquareColor = '#b58863',
    pieces = getDefaultLineup()
  }: Props) {

    const [state, dispatch] = useReducer(updateState, size, resetState)
    const { targetTile, draggingPiece, boardSize, tileSize, dragFrom } = state

    const handleDrag = (evt: DraggableEvent, drag: DraggableData): any => {
      if (!highlightTarget) {
        return
      }

      const { x, y } = coordsToPosition({
        tileSize,
        x: drag.node.offsetLeft + drag.x,
        y: drag.node.offsetTop + drag.y
      })

      if (!targetTile || targetTile.x !== x || targetTile.y !== y) {
        dispatch({type: 'movingTo', data: {x ,y} })
      }
    }

    const handleDragStart = (evt: DraggableEvent, drag: DraggableData): any => {
      evt.preventDefault()

      if (!allowMoves) {
        return false
      }

      const node = drag.node
      const dragFrom = coordsToPosition({ tileSize, x: node.offsetLeft, y: node.offsetTop })
      const draggingPiece = findPieceAtPosition({ pieces, pos: dragFrom.pos })
      if (onDragStart(draggingPiece) === false) {
        return false
      }

      dispatch({type: 'pick', data: {dragFrom , draggingPiece, whiteTurn, pieces} })
      return evt
    }

    const handleDragStop = (evt: DraggableEvent, drag: DraggableData): any => {
      if (!!evt['nativeEvent']) return // FIXME: prevent doble handle drop

      const node = drag.node
      const dragTo = coordsToPosition({ tileSize, x: node.offsetLeft + drag.x, y: node.offsetTop + drag.y })

      dispatch({type:'drop'})

      if (dragFrom.pos !== dragTo.pos) {

        // check if pawn promotion
        const landingPieceName = (draggingPiece.name === 'P' && targetTile.y === 0) ? 'Q' :
                                 (draggingPiece.name === 'p' && targetTile.y === 7) ? 'q' : 
                                  draggingPiece.name;

        onMovePiece({...draggingPiece, name: landingPieceName}, dragFrom.pos, dragTo.pos)
        return false
      }

      return true
    }

    return (
      <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: boardSize }}>
        <Tiles marks={state.marks} targetTile={targetTile} darkSquareColor={darkSquareColor} lightSquareColor={lightSquareColor} drawLabels={drawLabels} />
        <DraggablePieces pieces={pieces} draggingPiece={draggingPiece} handleDrag={handleDrag} handleDragStart={handleDragStart} handleDragStop={handleDragStop} />
      </div>
    )
  }


export default Chess
