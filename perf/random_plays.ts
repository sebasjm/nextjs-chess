
import { PerformanceObserver, performance } from 'perf_hooks';
import Histogram from 'native-hdr-histogram';
import { Board, Piece } from '../src/logic';
import lineUp from '../src/defaultLineup'
import { translatePieces, move } from '../src/logic/index'

const histogram = new Histogram(1, 1000 * 1000)

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach(e => {
    histogram.record(e.duration * 1000)
  })
});
obs.observe({ entryTypes: ['function'], buffered: true });


let intialSeed = 1
let seed = intialSeed;
function random() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}


function choose(state: State) {
  const board: Board = { pieces: state.pieces };
  board.castle = state.castle[state.turn]
  // board.passant = state.passant

  const actions = state.pieces
    .filter(f => f && state.turn !== f.group)
    .flatMap(from => {
      return move(from, board).map(dest => ({ from, dest }))
    })

  const rnd_move = Math.floor(random() * actions.length)

  if (!actions[rnd_move]) {
    throw Error('check mate?')
  }

  return actions[rnd_move]

}

function makeMove(state: State) {
  const { from, dest } = performance.timerify(choose)(state)
  const from_idx = from.x + from.y * 8
  const dest_idx = dest.x + dest.y * 8

  if (state.pieces[dest_idx]) state.count[state.turn === 2 ? 3 : 2]-- //is eating
  const fi = state.pieces[from_idx]
  state.pieces[dest_idx] = { ...fi, x: dest.x, y: dest.y }
  state.pieces[from_idx] = null

  const fromRank = from.type === 1 ? from.y : (from.type === 2 ? 7 - from.y : 0);
  const toRank = dest.type === 1 ? dest.y : (dest.type === 2 ? 7 - dest.y : 0);

  if (fromRank === 1 && toRank === 3) {
    state.passant = dest.x
  } else {
    state.passant = false
  }
  const convert = toRank === 7
  if (convert) {
    state.pieces[dest_idx].type = 6
  }
  if (from.type === 7) {
    state.castle[state.turn].didMoveKing = true
  }
  if (from.type === 4 && from.x === 7) {
    state.castle[state.turn].didMoveShortTower = true
  }
  if (from.type === 4 && from.x === 0) {
    state.castle[state.turn].didMoveLongTower = true
  }

  state.history.push({ from, dest, convert })
  state.turn = state.turn === 2 ? 3 : 2
  // }
}

function printState(pieces) {
  let result = ''
  for (let j = 0; j < 64; j++) {
    const x = j % 8
    const y = Math.floor(j / 8)
    const i = x + (7 - y) * 8
    const c = pieces[i]
    result += (c ? c.type : ' ') + ((i + 1) % 8 ? '' : ` ${Math.floor(i / 8) + 1}\n`)
  }
  result += '\nabcdefgh'
  console.log(result)
}

interface State {
  count: any;
  pieces: Piece[];
  turn: number;
  castle: any;
  passant: number | false;
  history: any[]
}

var stop = false
function handle(signal) {
  console.log(`Received ${signal}`);
  stop = true
}

process.on('SIGINT', handle);
process.on('SIGTERM', handle);

// process.once('SIGINT', function (code) {
//   console.error('SIGINT received...');
//   stop = true
//   step = 0
// });

let step = 300;
let last_history
while (!stop) {
  last_history = []
  const state: State = {
    count: { [2]: 16, [3]: 16, },
    pieces: translatePieces(lineUp),
    turn: 2,
    castle: { [2]: {}, [3]: {}, },
    passant: false,
    history: last_history
  }
  console.time('run')
  try {
    while (step-- > 0) {
      makeMove(state)
    }
  } catch (e) {
    // console.log(e)
    console.log('seed:', intialSeed)
    state.history.forEach(({ from, dest, convert }, index) => {
      const move = index + 2
      if (move % 2 == 0) process.stdout.write((move / 2) + '.')
      process.stdout.write(`${' PPNRBQK'[from.type]}${'abcdefgh'[from.x]}${8 - from.y}${'abcdefgh'[dest.x]}${8 - dest.y}${convert ? '=Q' : ''} `)
    })
    console.log('mean:', histogram.mean())
    console.log('')
  }
  console.timeEnd('run')
  step = 300
  intialSeed++
  seed = intialSeed
}


setTimeout(() => {
  console.log('')

  console.log('mean:', histogram.mean())
  console.log('min:', histogram.min())
  console.log('max:', histogram.max())
  console.log('std:', histogram.stddev())
  console.log(histogram.percentiles())
}, 1000)
