import React, { CSSProperties, useState } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import defaultLineup from './defaultLineup';
import pieceComponents from './pieces';
import decode from './decode';

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
  onDragStart?: (d: Dragging, from: string) => boolean;
  pieces?: string[];
}
interface Dragging {
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
      </span>,
      <span key="bly" style={yLabelStyles as CSSProperties}>
        1
      </span>
    </>
  }

  const label = isLeftColumn ? 8 - y : String.fromCharCode(decode.charCodeOffset + x)
  return <span style={(isLeftColumn ? yLabelStyles : xLabelStyles) as CSSProperties}>{label}</span>
}

const cellStyles = ({ isTarget, lightSquareColor, darkSquareColor, x, y }) => ({
  ...squareStyles,
  background: getSquareColor({ lightSquareColor, darkSquareColor, x, y }),
  boxShadow: isTarget ? 'inset 0px 0px 0px 0.4vmin yellow' : undefined,
})

const Tiles = ({ targetTile, lightSquareColor, darkSquareColor, drawLabels }) => <>
  {Array.from({ length: 64 }, (v, i) => {
    const x = Math.floor(i % 8);
    const y = Math.floor(i / 8);

    const styles = cellStyles({
      isTarget: targetTile && targetTile.x === x && targetTile.y === y,
      lightSquareColor, darkSquareColor, x, y
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


function Chess({
  allowMoves = true,
  highlightTarget = true,
  drawLabels = true,
  onMovePiece = noop,
  onDragStart = noop,
  lightSquareColor = '#f0d9b5',
  darkSquareColor = '#b58863',
  pieces = getDefaultLineup()
}: Props) {

    const [state, setState] = useState<State>({
      tileSize: size / 8,
      boardSize: size
    })
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
        setState({...state, targetTile: { x, y } })
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
      if (onDragStart(draggingPiece, dragFrom.pos) === false) {
        return false
      }

      setState({...state, dragFrom, draggingPiece })
      return evt
    }

    const handleDragStop = (evt: DraggableEvent, drag: DraggableData): any => {
      const node = drag.node
      const dragTo = coordsToPosition({ tileSize, x: node.offsetLeft + drag.x, y: node.offsetTop + drag.y })

      setState({...state, dragFrom: null, targetTile: null, draggingPiece: null })

      if (dragFrom.pos !== dragTo.pos) {

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
        <Tiles targetTile={targetTile} darkSquareColor={darkSquareColor} lightSquareColor={lightSquareColor} drawLabels={drawLabels} />
        <DraggablePieces pieces={pieces} draggingPiece={draggingPiece} handleDrag={handleDrag} handleDragStart={handleDragStart} handleDragStop={handleDragStop} />
      </div>
    )
  }


export default Chess
