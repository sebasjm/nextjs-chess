
import { PerformanceObserver, performance } from 'perf_hooks';
import Histogram from 'native-hdr-histogram';
import { Board } from '../src/logic';
import lineUp from '../src/defaultLineup'
import {orderPieces, pieceTypeByName, move} from '../src/logic/index'

const histogram = new Histogram(1, 1000*1000)

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach(e =>{
    histogram.record(e.duration*1000)
  })
});
obs.observe({ entryTypes: ['function'], buffered: true });


function translatePieces(ps) {
  return orderPieces(ps.map(name => ({
    x: name.codePointAt(2) - 'a'.codePointAt(0),
    y: name.codePointAt(3) - '1'.codePointAt(0),
    group: (name.charAt(0) === name.charAt(0).toLocaleLowerCase()) ? 2 : 3,
    type: pieceTypeByName(name.charAt(0))
  })).filter(Boolean))
}

var seed = 2;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

let moveNumber = 0

function makeRandomMove(state) {
  const rnd = Math.floor(random() * state.count[state.turn])
  let i = rnd
  const from = state.pieces.find(l => {
    if (!l) return false
    if (state.turn === l.group) return false
    if (!i) return l
    i--
  })
  // console.log("elegido", from)
  const from_idx = from.x + from.y * 8 
  
  const board: Board = {pieces:state.pieces};
  board.castle = state.castle[state.turn]
  board.passant = state.passant
  // printState(board.pieces)

  const possible_moves = performance.timerify(move)(from,board)
  if (possible_moves.length) {
    const rnd_move = Math.floor(random() * possible_moves.length)
    const dest = possible_moves[rnd_move]
    // console.log("movimiento", dest)
    const dest_idx = dest.x + dest.y * 8 
  
    if (state.pieces[dest_idx]) state.count[state.turn === 2 ? 3 : 2]-- //is eating
    const fi = state.pieces[from_idx]
    state.pieces[dest_idx] = {...fi, x: dest.x, y:dest.y}
    state.pieces[from_idx] = null

    const fromRank = from.type === 1 ? from.y : (from.type === 2 ? 7 - from.y : 0);
    const toRank   = dest.type === 1 ? dest.y : (dest.type === 2 ? 7 - dest.y : 0);

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

    if (state.turn === 2 ) {
      console.log('')
      moveNumber++
      process.stdout.write(moveNumber+'.')
    }
    process.stdout.write(`${' PPNRBQK'[from.type]}${'abcdefgh'[from.x]}${from.y+1}${'abcdefgh'[dest.x]}${dest.y+1}${convert?'=Q':''} `)
    state.turn = state.turn === 2 ? 3 : 2
  }
}

function printState(pieces) {
  let result = ''
  for(let j = 0; j < 64; j++) {
    const x = j%8
    const y = Math.floor(j/8)
    const i = x + (7-y) * 8
    const c = pieces[i]
    result += (c?c.type:' ')+((i+1)%8?'':` ${Math.floor(i/8)+1}\n`)
  }
  result += '\nabcdefgh'
  console.log(result)
}

const state = {
  count: { [2] : 16, [3] : 16, }, 
  pieces: translatePieces(lineUp), 
  turn: 2,
  castle: { [2]: {}, [3]: {}, },
  passant: false
}

let step = 500;
while(step--) {
  makeRandomMove(state)
}
console.log('')
setTimeout(()=>{
  console.log('mean:',histogram.mean())
  console.log('min:',histogram.min())
  console.log('max:',histogram.max())
  console.log('std:',histogram.stddev())
  console.log(histogram.percentiles()) 
},1000)

