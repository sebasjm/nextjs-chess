
import { PerformanceObserver, performance } from 'perf_hooks';
import Histogram from 'native-hdr-histogram';
import { Board, Piece } from '../src/logic';
import lineUp from '../src/defaultLineup'
import { translatePieces, move, makeMove, Action } from '../src/logic/index'

// const histogram = new Histogram(1, 1000 * 1000)

// const obs = new PerformanceObserver((items) => {
//   items.getEntries().forEach(e => {
//     histogram.record(e.duration * 1000)
//   })
// });
// obs.observe({ entryTypes: ['function'], buffered: true });


let initialSeed = 1
let seed = initialSeed;
function random() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}


function choose(state: Board, turn: number): Action {
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

  const rnd_move = Math.floor(random() * actions.length)

  if (!actions[rnd_move]) {
    throw Error('check mate?')
  }

  return actions[rnd_move]

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

// interface State {
//   pieces: Piece[];
//   castle: any;
//   passant: number | undefined;
// }
// let turn: number;

var stop = false
function handle(signal) {
  console.error(`Received ${signal}`);
  stop = true
}

process.on('SIGQUIT', handle);
process.on('SIGINT', handle);
process.on('SIGTERM', handle);

process.once('SIGINT', function (code) {
  console.error('SIGINT received...');
  stop = true
  step = 0
});

let step = 300;

function run() {
  if (stop) return;

  const history = []

  let turn = 2;
  const state: Board = {
    pieces: translatePieces(lineUp),
    castle: { [2]: {}, [3]: {}, },
    passant: undefined,
  }
  console.time('run')
  let currentState = state
  try {
    while (step-- > 0) {
      const action = performance.timerify(choose)(currentState, turn)
      history.push(action)
      turn = turn === 2 ? 3 : 2;
      currentState = makeMove(currentState, action)
    }
  } catch (e) {
    // console.log(e)
    console.log('seed:', initialSeed)
    history.forEach(({ from, dest, convert }, index) => {
      const move = index + 2
      if (move % 2 == 0) process.stdout.write((move / 2) + '.')
      process.stdout.write(`${' PPNRBQK'[from.type]}${'abcdefgh'[from.x]}${8 - from.y}${'abcdefgh'[dest.x]}${8 - dest.y}${convert ? '=Q' : ''} `)
    })
    // console.log('mean:', histogram.mean())
    console.log('')
  }
  console.timeEnd('run')
  step = 300
  initialSeed++
  seed = initialSeed
  setImmediate(run)
}

run()

// setTimeout(() => {
//   console.log('')

//   console.log('mean:', histogram.mean())
//   console.log('min:', histogram.min())
//   console.log('max:', histogram.max())
//   console.log('std:', histogram.stddev())
//   console.log(histogram.percentiles())
// }, 1000)
