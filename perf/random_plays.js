'use strict';

const { PerformanceObserver, performance } = require('perf_hooks');
const Histogram = require('native-hdr-histogram')
const histogram = new Histogram(1, 1000*1000)

const obs = new PerformanceObserver((items) => {
  histogram.record(items.getEntries()[0].duration*1000)
  // console.log(items.getEntries()[0].duration)
  // console.log(Math.floor(items.getEntries()[0].duration*1000))
});
obs.observe({ entryTypes: ['function'] }, true);

const {orderPieces, pieceTypeByName, movesByType} = require('../dist/src/logic/index')
const lineUp = require('../dist/src/defaultLineup.jsx').default

function translatePieces(ps, whiteTurn) {
  return orderPieces(ps.map(name => ({
    x: name.codePointAt(2) - 'a'.codePointAt(0),
    y: (y => whiteTurn ? y : 7 - y)(name.codePointAt(3) - '1'.codePointAt(0)),
    foe: whiteTurn === (name.charAt(0) === name.charAt(0).toLocaleLowerCase()),
    type: pieceTypeByName(name.charAt(0))
  })).filter(Boolean))
}

function invertBoard(__pieces) {
  const emptyBoard = Array(8 * 8);
  __pieces.forEach(function setEnemyBoardIfPresent(p) {
    if (p) emptyBoard[p.x + (7 - p.y) * 8] = {
      x: p.x,
      y: 7 - p.y,
      type: p.type,
      foe: !p.foe
    }
  })
  return emptyBoard
}

var seed = 4;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

let move = 0

function pepe(state) {
  const rnd = Math.floor(random() * state.count[state.whiteTurn])
  let i = rnd
  const from = state.pieces.find(l => {
    if (!l) return false
    if (state.whiteTurn ? !!l.foe : !l.foe) return false
    if (!i) return l
    i--
  })
  // console.log("elegido", from)
  const from_idx = from.x + from.y * 8 
  
  const board = state.whiteTurn ? {pieces:state.pieces} : {pieces: invertBoard(state.pieces)};
  board.castle = state.castle[state.whiteTurn]
  board.passant = state.passant
  // printState(board.pieces)
  const f = state.whiteTurn ? from : {...from,y:7-from.y}

  const possible_moves = performance.timerify(movesByType[from.type])(f,board)
  if (possible_moves.length) {
    const rnd_move = Math.floor(random() * possible_moves.length)
    const pos = possible_moves[rnd_move]
    const dest = state.whiteTurn ? pos : {...pos,y:7-pos.y}
    // console.log("movimiento", dest)
    const dest_idx = dest.x + dest.y * 8 
  
    if (state.pieces[dest_idx]) state.count[!state.whiteTurn]-- //is eating
    const fi = state.pieces[from_idx]
    state.pieces[dest_idx] = {...fi, x: dest.x, y:dest.y}
    state.pieces[from_idx] = null

    if (from.type === 1 && pos.y === 3) {
      state.passant = pos.x
    } else {
      state.passant = false
    }
    const convert = from.type === 1 && pos.y === 7
    if (convert) {
      state.pieces[dest_idx].type = 5
    }
    if (from.type === 6) {
      state.castle[state.whiteTurn].didMoveKing = true
    }
    if (from.type === 3 && from.x === 7) {
      state.castle[state.whiteTurn].didMoveShortTower = true
    }
    if (from.type === 3 && from.x === 0) {
      state.castle[state.whiteTurn].didMoveLongTower = true
    }

    if (state.whiteTurn) {
      // console.log('')
      move++
      // process.stdout.write(move+'.')
    }
    // process.stdout.write(`${' PNRBQK'[from.type]}${'abcdefgh'[from.x]}x${'abcdefgh'[dest.x]}${dest.y+1}${convert?'=Q':''} `)
    state.whiteTurn = !state.whiteTurn
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

let _whiteTurn = true
const _pieces = translatePieces(lineUp, _whiteTurn)
let _count = {
  [true]  : 16,
  [false] : 16,
}

const state = {
  count:_count, 
  pieces:_pieces, 
  whiteTurn:_whiteTurn,
  castle: {
    [true]: {},
    [false]: {},
  },
  passant: false
}

let step = 500;
while(step--) {
  pepe(state)
}
console.log('')

console.log(histogram.mean())
console.log(histogram.min())
console.log(histogram.max())
console.log(histogram.stddev())
console.log(histogram.percentiles())