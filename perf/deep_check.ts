
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

function moveGenerator(depth: number, board: Board) {
  if (depth === 0) return 1

  const turn = depth % 2 ? 2 : 3;

  const actions = board.pieces
    .filter(f => f && turn !== f.group)
    .flatMap(from => {
      return move(from, board).map(dest => ({ from, dest }))
    })

  return actions.reduce((prev, curr) => prev + moveGenerator(depth - 1, makeMove(board, curr)), 0)
}

console.time('moves')
const moves = moveGenerator(2, initialState)
console.timeEnd('moves')

// iteration 1
// depth 3 12464.527ms
// depth 2 592.503ms

