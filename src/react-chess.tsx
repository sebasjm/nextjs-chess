import React, { CSSProperties, MouseEventHandler, SyntheticEvent, useReducer, useRef, useState } from 'react';
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
  pieces?: string[];
  marks?: { x: number, y: number }[],
  onClick?: (p: Position) => boolean;
  allowMoves?: boolean;
  drawLabels?: boolean;
  lightSquareColor?: string;
  darkSquareColor?: string;
  size?: number;
}
export interface Dragging {
  notation: string;
  name: string;
  index: number;
};

interface State {
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

type Position = {
  x: number, y: number, pos: string;
}
const toPosition = ({ x, y }): Position => ({ x, y, pos: `${String.fromCharCode('a'.codePointAt(0) + x)}${y+1}` })

function coordsToPosition({ tileSize, x, y }) {
  return toPosition({
    x: Math.floor(x / tileSize),
    y: 7-Math.floor(y / tileSize),
  })
}

function getSquareColor({ lightSquareColor, darkSquareColor, x, y }) {
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

  const label = isLeftColumn ? 8 - y : String.fromCharCode('a'.codePointAt(0) + x)
  return <span style={(isLeftColumn ? yLabelStyles : xLabelStyles) as CSSProperties}>{label}</span>
}

function cellStyles({ isTarget, lightSquareColor, darkSquareColor, x, y, isValid }) {
  return ({
    ...squareStyles,
    background: getSquareColor({ lightSquareColor, darkSquareColor, x, y }),
    boxShadow: isTarget ? 'inset 0px 0px 0px 0.4vmin yellow' : (isValid ? 'inset 0px 0px 0px 0.4vmin green' : undefined),
  })
}

function Tiles({ targetTile, lightSquareColor, darkSquareColor, drawLabels, marks }) {
  return <>
    {Array.from({ length: 64 }, (v, i) => {
      const x = Math.floor(i % 8);
      const y = Math.floor(i / 8);

      const styles = cellStyles({
        isTarget: targetTile && targetTile.x === x && targetTile.y === y,
        lightSquareColor, darkSquareColor, x, y,
        isValid: (marks as { x: number, y: number }[] || []).findIndex(v => v.x === x && v.y === 7-y) !== -1
      });

      return <div key={`rect-${x}-${y}`} style={styles as CSSProperties}>
        <LabelText x={x} y={y} drawLabels={drawLabels} />
      </div>
    })}
  </>
}

function DraggablePieces({ pieces }) {
  return <>
    {pieces.map((decl, i) => {
      const { x, y, piece } = decode.fromPieceDecl(decl)
      const Piece = pieceComponents[piece]
      return <div key={`${piece}-${x}-${y}`}>
        <Piece x={x} y={y} />
      </div>
    })}
  </>
}

function Chess({
  allowMoves = true,
  drawLabels = true,
  onClick = noop,
  lightSquareColor = '#f0d9b5',
  darkSquareColor = '#b58863',
  size = 600,
  pieces = getDefaultLineup(),
  marks = [],
}: Props) {

  const boardEl = useRef(null)
  // const [state, dispatch] = useReducer(updateState, size, resetState)
  // const { draggingPiece, dragFrom: df } = state

  const handlePick: MouseEventHandler = (ev) => {
    if (!allowMoves) {
      return false
    }

    const bbox = boardEl.current.getBoundingClientRect();
    const x = ev.clientX - bbox.left;
    const y = ev.clientY - bbox.top;

    const dragFrom = coordsToPosition({ tileSize: size/8, x, y })

    return onClick(dragFrom)

    // const mark = marks?.find(m => m.x === dragFrom.x && m.y === dragFrom.y)
    // if (mark) {
    //   dispatch({ type: 'drop' })
    //   // check if pawn promotion
    //   const landingPieceName = (draggingPiece.name === 'P' && dragFrom.y === 0) ? 'Q' :
    //     (draggingPiece.name === 'p' && dragFrom.y === 7) ? 'q' :
    //       draggingPiece.name;

    //   onMovePiece({ ...draggingPiece, name: landingPieceName }, df.pos, dragFrom.pos)
    //   return true
    // }


  }

  return (
    <div ref={boardEl} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: size }} onClick={handlePick}>
      <Tiles marks={marks} targetTile={null} darkSquareColor={darkSquareColor} lightSquareColor={lightSquareColor} drawLabels={drawLabels} />
      <DraggablePieces pieces={pieces} />
    </div>
  )
}


export default Chess
