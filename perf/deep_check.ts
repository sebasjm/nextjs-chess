
import { PerformanceObserver, performance } from 'perf_hooks';
import Histogram from 'native-hdr-histogram';
import { Board, Piece } from '../src/logic';
import lineUp from '../src/defaultLineup'
import { translatePieces, move, makeMove, Action } from '../src/logic/index'

const initialState: Board = {
  pieces: translatePieces(lineUp),
  castle: { [2]: {}, [3]: {}, },
  passant: undefined,
}

const d = [0, 0, 0]

function moveGenerator(depth: number, state: Board, moved: Action[]) {
  if (depth === 0) return 1

  const turn = depth % 2 ? 2 : 3;

  const board: Board = { 
    pieces: state.pieces,
    castle: state.castle,
    passant: state.passant,
  };

  const actions = state.pieces
    .filter(f => f && turn !== f.group)
    .flatMap(from => {
      return move(from, board).map(dest => ({ from, dest }))
    })

  return actions.reduce((prev, curr) => prev + moveGenerator(depth - 1, makeMove(state, curr), [curr, ...moved]), 0)
}

console.time('moves')
const moves = moveGenerator(3, initialState, [])
console.timeEnd('moves')
console.log(moves, d)
