
import { PerformanceObserver, performance } from 'perf_hooks';
import Histogram from 'native-hdr-histogram';
import { Board, Piece } from '../src/logic';
import lineUp from '../src/defaultLineup'
import { translatePieces, move, makeMove, Action, MoveType } from '../src/logic/index'

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


function choose(board: Board, turn: number): Action {
  const actions = board.pieces
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
      const {moveType, ...nextBoard} = makeMove(currentState, action)
      turn = turn === 2 ? 3 : 2;
      currentState = nextBoard
      history.push({...action, moveType})
    }
  } catch (e) {
    // console.log(e)
    console.log('seed:', initialSeed)
    history.forEach(({ from, dest, moveType }, index) => {
      const move = index + 2
      if (move % 2 == 0) process.stdout.write((move / 2) + '.')
      process.stdout.write(`${' PPNRBQK'[from.type]}${'abcdefgh'[from.x]}${8 - from.y}${'abcdefgh'[dest.x]}${8 - dest.y}${moveType === MoveType.CONVERT ? '=Q' : ''} `)
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


// 1.Pb2b4 Pa7a6 2.Pg2g4 Pf7f5 3.Ng1h3 Ke8f7 4.Nb1a3 Pg7g5 5.Nh3g1 Ra8a7 6.Pb4b5 Pa6b5 7.Ra1b1 Pc7c6 8.Pf2f4 Ng8h6 9.Pd2d3 Ra7a5 10.Pc2c4 Qd8b6 11.Rb1b2 Qb6e3 12.Bc1d2 Qe3d3 13.Bd2e3 Qd3e2 14.Ng1e2 Pd7d5 15.Ne2g3 Pe7e6 16.Be3b6 Kf7f6 17.Qd1c2 Ra5a6 18.Bb6a5 Pd5c4 19.Qc2c3 Pe6e5 20.Qc3d3 Kf6g6 21.Na3b1 Bc8e6 22.Qd3d1 Nh6f7 23.Ke1d2 Bf8e7 24.Ba5d8 Be7b4 25.Kd2c2 Bb4f8 26.Ng3f5 Ph7h6 27.Qd1d7 Pc4c3 28.Kc2d1 Pc3c2 29.Kd1c1 Nf7d8 30.Qd7g7 Bf8g7 31.Nb1c3 Ph6h5 32.Nf5e3 Pb7b6 33.Bf1c4 Ra6a4 34.Pf4e5 Bg7h6 35.Rh1g1 Ra4a3 36.Rb2b3 Kg6g7 37.Kc1b2 Rh8f8 38.Nc3a4 Be6g4 39.Ne3d1 Nb8d7 40.Bc4f1 Bg4d1 41.Rb3a3 Kg7g8 42.Pe5e6 Kg8g7 43.Rg1g4 Rf8f7 44.Na4c5 Nd7c5 45.Bf1c4 Rf7f4 46.Ra3f3 Rf4f8 47.Rg4f4 Kg7h8 48.Rf4h4 Bd1e2 49.Kb2a1 Pc2c1=Q 
