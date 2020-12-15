
export function findPieceAtPosition({ pieces, pos }) {
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]
    if (piece.indexOf(pos) === 2) {
      return { notation: piece, name: piece.slice(0, 1), index: i, position: pos }
    }
  }

  return null
}

type F = (move: DeltaPos) => (orig: Piece, board: Board) => IsMoveValid

type D = (orig: Piece, board: Board) => IsMoveValid

//TODO: this could be better, like validAnd
function validOr(validator1: F, validator2: F) {
  return function applyValidOr(move: DeltaPos) {
    const cond1 = validator1(move);
    const cond2 = validator2(move);
    return function applyApplyValidOr(orig: Piece, board: Board): IsMoveValid {
      const xy1 = cond1(orig, board)
      return xy1 ? xy1 : cond2(orig, board)
    }
  }
}

function validAnd(cond1: D, cond2: F) {
  return function applyValidAnd(orig: Piece, board: Board): IsMoveValid {
    const p = cond1(orig, board)
    if (!p) return null
    const move: DeltaPos = {
      x: p.x - orig.x,
      y: p.y - orig.y,
    } //recalculate delta
    return cond2(move)(orig, board)
  }
}

function validTrue(move: DeltaPos) {
  return function applyValidTrue(idx, board): IsMoveValid {
    return add(idx, move)
  }
}
function validFalse(orig: Piece, board: Board): IsMoveValid { return null }

function validAll(...conds: D[]) {
  return function applyValidAll(orig: Piece, board: Board): IsMoveValid {
    function applyPrevious(prev: D, val: D) {
      return !prev(orig, board) ? validFalse : val
    }
    return conds.reduce(applyPrevious, conds[0])(orig, board)
  }
}
// for the pawn
function validIfEnemy(move: DeltaPos) {
  return function applyValidIfEnemy(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const piece = board.pieces[dest.x + dest.y * 8]
    return piece && (piece.group !== orig.group) ? dest : null
  }
}

// for the bishop, rogue, queen
function validIfEmpty(move: DeltaPos) {
  return function applyValidIfEmpty(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const piece = board.pieces[dest.x + dest.y * 8]
    return !piece ? dest : null
  }
}

function validIfBlackRank1(move: DeltaPos) {
  return function applyBlackRank1(orig: Piece, board: Board): IsMoveValid {
    return orig.y === 7 ? add(orig, move) : null
  }
}

function validIfWhiteRank1(move: DeltaPos) {
  return function applyWhiteRank1(orig: Piece, board: Board): IsMoveValid {
    return orig.y === 1 ? add(orig, move) : null
  }
}

// for the pawn
function validIfPassant(move: DeltaPos) {
  return function applyValidIfPassant(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    if (board.passant !== dest.x) return null
    const piece = board.pieces[dest.x + (dest.y - 1) * 8]
    const isEnemy = piece && (piece.group !== orig.group)

    return isEnemy ? dest : null
  }
}

function printState(pieces:Piece[]) {
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

function printThreat(attacked:number[]) {
  let result = ''
  for(let j = 0; j < 64; j++) {
    const x = j%8
    const y = Math.floor(j/8)
    const i = x + (7-y) * 8
    const c = attacked[i]
    result += (c?c:' ')+((i+1)%8?'':` ${Math.floor(i/8)+1}\n`)
  }
  result += '\nabcdefgh'
  console.log(result)
}

function threatZone(board: Board): number[] {
  const result = Array<number>(8 * 8)
  result.fill(0)
  board.pieces.forEach(function updateDangerous(enemy) {
    if (enemy) threatsByType[enemy.type](enemy, board).forEach(function mark(attack) {
      result[attack.x + attack.y * 8] += first20Primes[enemy.group]
    })
  })

  // printState(board.pieces)
  // printThreat(result)
  return result
}

function validIfKingSafe(move: DeltaPos) {
  return function applyValidIfKingSafe(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const king = orig.type == PieceType.King ? dest : board.pieces.find(p => p && (p.group === dest.group) && p.type === PieceType.King)
    if (!king) return dest // we are safe if there is no king in the board

    const nextBoard = {
      pieces: Array.from(board.pieces)
    }
    nextBoard.pieces[orig.x + orig.y * 8] = null
    nextBoard.pieces[dest.x + dest.y * 8] = dest

    const attacked = threatZone(nextBoard);
    // const attacked = cacheBoard(ugly_and_naive_hashing1, threatZone, nextBoard);
    const safe = (attacked[king.x + king.y * 8] % first20Primes[king.group]) == 0

    return safe ? dest : null
  }
}
function validIfShortCastle(move: DeltaPos) {
  return function applyValidIfShortCastle(orig: Piece, board: Board): IsMoveValid {
    // history ok?
    if (board.castle?.didMoveKing || board.castle?.didMoveShortTower) return null

    // pieces in place?
    const king = board.pieces[4 + 0 * 8]
    const path5 = board.pieces[5 + 0 * 8]
    const path6 = board.pieces[6 + 0 * 8]
    const tower = board.pieces[7 + 0 * 8]

    if (!tower || tower.type != PieceType.Rook
      || path5 || path6
      || !king || king.type != PieceType.King) return null

    // path is safe?
    const attacked = threatZone(board);
    // const attacked = cacheBoard(ugly_and_naive_hashing1, threatZone, board);
    const pathSafe = (attacked[5 + 0 * 8] % first20Primes[king.group]) == 0 
      && (attacked[6 + 0 * 8]% first20Primes[king.group]) == 0

    return pathSafe ? add(orig, move) : null
  }
}

function validIfLongCastle(move: DeltaPos) {
  return function applyValidIfLongCastle(orig: Piece, board: Board): IsMoveValid {
    if (board.castle?.didMoveKing || board.castle?.didMoveLongTower) return null
    const tower = board.pieces[0 + 0 * 8]
    const path1 = board.pieces[1 + 0 * 8]
    const path2 = board.pieces[2 + 0 * 8]
    const path3 = board.pieces[3 + 0 * 8]
    const king = board.pieces[4 + 0 * 8]

    if (!tower || tower.type != PieceType.Rook
      || path1 || path2 || path3
      || !king || king.type != PieceType.King) return null

    const attacked = threatZone(board);
    // const attacked = cacheBoard(ugly_and_naive_hashing1, threatZone, board);
    const pathSafe = (attacked[1 + 0 * 8] % first20Primes[king.group]) == 0 
      && (attacked[2 + 0 * 8] % first20Primes[king.group]) == 0 
      && (attacked[3 + 0 * 8] % first20Primes[king.group]) == 0

    return pathSafe ? add(orig, move) : null
  }
}

function validIfInside(move: DeltaPos) {
  return function applyValidIfInside(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const { x, y } = dest
    return x <= 7 && x >= 0 && y <= 7 && y >= 0 ? dest : null
  }
}

function validIfNoFriend(move: DeltaPos) {
  return function applyValidIfNoFriend(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const piece = board.pieces[dest.x + dest.y * 8]
    const isFriend = piece && (piece.group === dest.group)
    return !isFriend ? dest : null
  }
}

function add(p: Piece, move: DeltaPos) {
  return ({ x: p.x + move.x, y: p.y + move.y, type: p.type, group: p.group })
}

type IsMoveValid = Pos | null
type Delta = [x: number, y: number]
type DeltaPos = Pos
const asDeltaPos = (d: Delta): DeltaPos => ({ x: d[0], y: d[1] })

interface Pos {
  x: number,
  y: number,
}

export enum PieceType {
  WhitePawn = 1, BlackPawn, Knigth, Rook, Bishop, Queen, King
}

const first20Primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71]

export interface Piece {
  x: number,
  y: number,
  group: number,
  type: PieceType
}
export interface Board {
  pieces: Piece[];// pieces on board
  passant?: number; //did group an en'passant on last move?
  castle?: {
    didMoveKing?: boolean; //is still posible to castle?
    didMoveShortTower?: boolean; //is still posible to castle?
    didMoveLongTower?: boolean; //is still posible to castle?
  };
}

const arraySizeSeven = [0, 1, 2, 3, 4, 5, 6]
function expandStepToPath(v: DeltaPos, i: number, a: DeltaPos[]) {
  return [...a].reverse().slice(-i - 1).reverse()
}
function checkValidInTheMiddle(validator: F) {
  return function applyValidatorOnPath(x: DeltaPos[]) {
    return x.slice(0, -1).map(x => validator(x)).concat(validTrue(x[x.length - 1]))
  }
}

function sevenWithClearPath(direction: (i: number) => Delta): D[] {
  return (
    arraySizeSeven.map(direction)
      .map(asDeltaPos)
      .map(expandStepToPath)
      .map(checkValidInTheMiddle(validIfEmpty))
      .map(x => x.reduce((p, c) => validAll(p, c)))
  )
}

function buildValidator(type: PieceType, moveValidators: D[]) {
  return function validator(orig: Piece, board: Board): Piece[] {
    function checkIfValid(v) { return v(orig, board) }
    
    return moveValidators.map(checkIfValid).filter(Boolean)
  }
}

const whitePawnMoves = [
  validIfEmpty(asDeltaPos([0, 1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([1, 1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([-1, 1])),
  validAll(validIfEmpty(asDeltaPos([0, 1])), validAnd(validIfEmpty(asDeltaPos([0, 2])),validIfWhiteRank1)),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside));

const whitePawnMovesWithKingSafe = whitePawnMoves.map(x => validAnd(x, validIfKingSafe))

const blackPawnMoves = [
  validIfEmpty(asDeltaPos([0, -1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([1, -1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([-1, -1])),
  validAll(validIfEmpty(asDeltaPos([0, -1])), validAnd(validIfEmpty(asDeltaPos([0, -2])),validIfBlackRank1)),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside));

const blackPawnMovesWithKingSafe = blackPawnMoves.map(x => validAnd(x, validIfKingSafe))

const knigthMoves = ([
  [+1, +2],
  [+1, -2],
  [-1, +2],
  [-1, -2],
  [+2, +1],
  [+2, -1],
  [-2, +1],
  [-2, -1],
] as Delta[])
  .map(asDeltaPos)
  .map(x => validIfNoFriend(x))
  .map(x => validAnd(x, validIfInside))

const knigthMovesWithKingSafe = knigthMoves.map(x => validAnd(x, validIfKingSafe))

const rookMoves = [
  ...sevenWithClearPath(i => [0, i + 1]),
  ...sevenWithClearPath(i => [i + 1, 0]),
  ...sevenWithClearPath(i => [-i - 1, 0]),
  ...sevenWithClearPath(i => [0, -i - 1]),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside))

const rookMovesWithKingSafe = rookMoves.map(x => validAnd(x, validIfKingSafe))

const bishopMoves = [
  ...sevenWithClearPath(i => [i + 1, i + 1]),
  ...sevenWithClearPath(i => [i + 1, -i - 1]),
  ...sevenWithClearPath(i => [-i - 1, i + 1]),
  ...sevenWithClearPath(i => [-i - 1, -i - 1]),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside))

const bishopMovesWithKingSafe = bishopMoves.map(x => validAnd(x, validIfKingSafe))

const queenMoves = [...rookMoves, ...bishopMoves]

const queenMovesWithKingSafe = queenMoves.map(x => validAnd(x, validIfKingSafe))

const kingMoves = ([
  [+1, +1],
  [+1, 0],
  [+1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, +1],
  [0, +1],
] as Delta[])
  .map(asDeltaPos)
  .map(x => validIfNoFriend(x))
  .map(x => validAnd(x, validIfInside))

const kingMovesWithKingSafe = kingMoves
  .concat(validIfLongCastle(asDeltaPos([-2, 0])))
  .concat(validIfShortCastle(asDeltaPos([2, 0])))
  .map(x => validAnd(x, validIfKingSafe))

export const moves: { [k: string]: ((orig: Piece, board: Board) => Piece[]) } = {
  wp: buildValidator(PieceType.WhitePawn, whitePawnMovesWithKingSafe),
  bp: buildValidator(PieceType.BlackPawn, blackPawnMovesWithKingSafe),
  n: buildValidator(PieceType.Knigth, knigthMovesWithKingSafe),
  r: buildValidator(PieceType.Rook, rookMovesWithKingSafe),
  b: buildValidator(PieceType.Bishop, bishopMovesWithKingSafe),
  q: buildValidator(PieceType.Queen, queenMovesWithKingSafe),
  k: buildValidator(PieceType.King, kingMovesWithKingSafe),
}

export function move(p: Pos, board: Board): Piece[] {
  const idx = p.x + p.y * 8
  const piece = board.pieces[idx]
  const algorithm = movesByType[piece.type]
  return algorithm(piece, board)
}

const threats: { [k: string]: ((orig: Piece, board: Board) => Piece[]) } = {
  wp: buildValidator(PieceType.WhitePawn, whitePawnMoves),
  bp: buildValidator(PieceType.BlackPawn, blackPawnMoves),
  n: buildValidator(PieceType.Knigth, knigthMoves),
  r: buildValidator(PieceType.Rook, rookMoves),
  b: buildValidator(PieceType.Bishop, bishopMoves),
  q: buildValidator(PieceType.Queen, queenMoves),
  k: buildValidator(PieceType.King, kingMoves),
}

export function swap({ x, y }: { x: number, y: number }, swap: boolean) {
  return ({ x, y: swap ? y : 7 - y })
}

export const movesByType = [
  ():Piece[] => [], //noop
  moves.wp,
  moves.bp,
  moves.n,
  moves.r,
  moves.b,
  moves.q,
  moves.k,
]

export const threatsByType = [
  ():Piece[] => [], //noop
  threats.wp,
  threats.bp,
  threats.n,
  threats.r,
  threats.b,
  threats.q,
  threats.k,
]
// .map(f => function applyOrderPieces(p: Pos, b: Board) { return orderPieces(f(p, b)) })
// .map(f => function applyCache(p: Pos, b: Board) { return cachePosAndBoard(ugly_and_naive_hashing2, f, p, b) })

export function orderPieces<T extends Pos>(pieces: T[]): T[] {
  const emptyBoard = Array(8 * 8);
  pieces.forEach(function setBoardIfPresent(p) {
    if (p) emptyBoard[p.x + p.y * 8] = p
  })
  return emptyBoard
}


export const pieceTypeByName = (str: string) => {
  switch (str.toLowerCase()) {
    case 'b': return PieceType.Bishop;
    case 'k': return PieceType.King;
    case 'n': return PieceType.Knigth;
    case 'r': return PieceType.Rook;
    case 'q': return PieceType.Queen;
    case 'p': return str !== str.toLowerCase() ? PieceType.WhitePawn : PieceType.BlackPawn;
    default: null
  }
}

// --- cache stuff

// const stats = {
//   hit: 0, miss: 0
// }
// const cacheBoardMemory = {}
// function cacheBoard(hash: (b: Board) => string, f: (b: Board) => boolean[], board: Board): boolean[] {
//   const id = hash(board)
//   if (cacheBoardMemory[id]) {
//     stats.hit++
//     // console.debug(stats.hit, stats.miss)
//     return cacheBoardMemory[id]
//   }
//   const result = f(board);
//   cacheBoardMemory[id] = result
//   stats.miss++
//   // console.debug(stats.hit, stats.miss)
//   return result
// }

// function ugly_and_naive_hashing1(board: Board) {
//   const b = `${board?.passant}${board?.castle?.didMoveKing}${board?.castle?.didMoveLongTower}${board?.castle?.didMoveShortTower}|`
//   const ps = board.pieces.map(p => !p ? '.' : `${p.x}${p.y}${p.type}${p.group}`)
//   return b + ps
// }

// function ugly_and_naive_hashing2(pos: Pos, board: Board) {
//   const b = `${pos.x}${pos.y}|${board?.passant}${board?.castle?.didMoveKing}${board?.castle?.didMoveLongTower}${board?.castle?.didMoveShortTower}|`
//   const ps = board.pieces.map(p => !p ? '.' : `${p.x}${p.y}${p.type}${p.group}`)
//   return b + ps
// }

// // const stats = {
// //   hit: 0, miss: 0
// // }

// const cachePosAndBoardMemory = {}
// function cachePosAndBoard(hash: (p: Pos, b: Board) => string, f: (p: Pos, b: Board) => Pos[], pos: Pos, board: Board): Pos[] {
//   const id = hash(pos, board)
//   if (cachePosAndBoardMemory[id]) {
//     // stats.hit++
//     // console.debug(Object.keys(cacheMemory).length, stats.hit, stats.miss)
//     return cachePosAndBoardMemory[id]
//   }
//   const result = f(pos, board);
//   cachePosAndBoardMemory[id] = result
//   // stats.miss++
//   // console.debug(Object.keys(cacheMemory).length, stats.hit, stats.miss)
//   return result
// }

// function printState(pieces) {
//   let result = ''
//   for(let j = 0; j < 64; j++) {
//     const x = j%8
//     const y = Math.floor(j/8)
//     const i = x + (7-y) * 8
//     const c = pieces[i]
//     result += (c?c.type:' ')+((i+1)%8?'':` ${Math.floor(i/8)+1}\n`)
//   }
//   result += '\nabcdefgh'
//   console.log(result)
// }

