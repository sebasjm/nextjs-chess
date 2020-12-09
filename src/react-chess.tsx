import React, { CSSProperties, MouseEventHandler, SyntheticEvent, useReducer, useRef, useState } from 'react';
import defaultLineup from './defaultLineup';
import pieceComponents from './pieces';
import decode from './decode';
import { orderPieces, swap, moves, Board, Piece, pieceTypeByName } from './logic'

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
  x: Math.floor(x / tileSize),
  y: Math.floor(y / tileSize),
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

const DraggablePieces = ({ pieces }) => <>
  {pieces.map((decl, i) => {
    const { x, y, piece } = decode.fromPieceDecl(decl)
    const Piece = pieceComponents[piece]
    return <div key={`${piece}-${x}-${y}`}>
      <Piece x={x} y={y} />  
    </div>
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

const translatePieces = (ps:string[], whiteTurn: boolean, exclude: string): Piece[] => orderPieces(ps
.map( name => name === exclude ? null : ({
  x: name.codePointAt(2) - 'a'.codePointAt(0),
  y: (y => whiteTurn ? y : 7-y)(name.codePointAt(3) - '1'.codePointAt(0)),
  foe: whiteTurn === (name.charAt(0) === name.charAt(0).toLocaleLowerCase()), 
  type: pieceTypeByName(name.charAt(0))
})).filter(Boolean))

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
      const validMoves = pieceStrategy(pos,board)
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
    drawLabels = true,
    onMovePiece = noop,
    onDragStart = noop,
    whiteTurn = true,
    passant = null,
    lightSquareColor = '#f0d9b5',
    darkSquareColor = '#b58863',
    pieces = getDefaultLineup()
  }: Props) {

    const boardEl = useRef(null)
    const [state, dispatch] = useReducer(updateState, size, resetState)
    const { targetTile, boardSize, tileSize, dragFrom } = state

    const handlePick: MouseEventHandler = (ev) => {
      if (!allowMoves) {
        return false
      }

      const bbox = boardEl.current.getBoundingClientRect();
      const x = ev.clientX - bbox.left;
      const y = ev.clientY - bbox.top;
      
      const dragFrom = coordsToPosition({ tileSize, x,y })

      const draggingPiece = findPieceAtPosition({ pieces, pos: dragFrom.pos })
      if (draggingPiece && onDragStart(draggingPiece)) {
        dispatch({type: 'pick', data: {dragFrom , draggingPiece, whiteTurn, pieces} })
        return true
      }

      const mark = state.marks?.find( m=> m.x === dragFrom.x && m.y === dragFrom.y )
      if (mark) {
        dispatch({type:'drop'})
        const {draggingPiece} = state
          // check if pawn promotion
        const landingPieceName = (draggingPiece.name === 'P' && dragFrom.y === 0) ? 'Q' :
                                 (draggingPiece.name === 'p' && dragFrom.y === 7) ? 'q' : 
                                  draggingPiece.name;

        onMovePiece({...draggingPiece, name: landingPieceName}, state.dragFrom.pos, dragFrom.pos)
        return true
      }


      return true
    }

    return (
      <div ref={boardEl} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: boardSize }} onClick={handlePick}>
        <Tiles marks={state.marks} targetTile={targetTile} darkSquareColor={darkSquareColor} lightSquareColor={lightSquareColor} drawLabels={drawLabels} />
        <DraggablePieces pieces={pieces} />
      </div>
    )
  }


export default Chess
