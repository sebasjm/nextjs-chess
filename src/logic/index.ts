export const findPieceAtPosition = ({ pieces, pos }) => {
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]
    if (piece.indexOf(pos) === 2) {
      return { notation: piece, name: piece.slice(0, 1), index: i, position: pos }
    }
  }

  return null
}

const toXY = (s:string, swap: boolean) => {
  return {
    x: s.codePointAt(0) - 'a'.codePointAt(0),
    y: s.codePointAt(1) - '1'.codePointAt(0)
  }
}
const fromXY = ({x,y}:{x:number, y:number}) => {
  return String.fromCodePoint('a'.codePointAt(0) + x) + String.fromCharCode('1'.codePointAt(0) + y)
}

const isWhite = (string) => /^[A-Z]*$/.test(string.charAt(0))

type F = (pos:Pos) => (board: Board) => Pos|null

type D = (board: Board) => Pos|null

const validOr = (cond1:F, cond2:F) => (pos:Pos) => (board: Board) => {
  const xy1 = cond1(pos)(board)
  return xy1 ? xy1 : cond2(pos)(board)
}

const validAnd = (cond1:D, cond2:F) => (board: Board) => {
  const pos = cond1(board)
  if (!pos) return null
  return cond2(pos)(board)
}

const validTrue:D = (board)=> ({} as any)
const validFalse:D = (board)=> (null as any)

const validAll = (...conds:D[]) => (board: Board) => {
  return conds.reduce((prev,val) => !prev(board)? validFalse : val, validTrue)(board)
}

// for the pawn
const validIfEnemy = (pos:Pos) => (board: Board) => {
  const piece = board.pieces.find(p => p.x === pos.x && p.y === pos.y)
  return piece && piece.foe ? pos : null
}

// for the bishop, rogue, queen
const validIfEmpty = (pos:Pos) => (board: Board) => {
  const piece = board.pieces.find(p => p.x === pos.x && p.y === pos.y)
  return !piece ? pos : null
}

const validIfEmptyAndPassant = (pos:Pos) => (board: Board) => {
  const piece = board.pieces.find(p => p.x === pos.x && p.y === pos.y)
  return !piece && pos.y === 3 ? pos : null
}

// for the pawn
const validIfPassant = (pos:Pos) => (board: Board) => {
  const piece = board.pieces.find(p => p.x === pos.x && p.y === pos.y -1)
  const isEnemy = piece && piece.foe

  return isEnemy && board.passant === piece.x ? pos : null
}

const validIfKingSafe = (pos:Pos) => (board: Board) => {
  //TODO: not implemented yet
  return pos
}

const validIfInside = (pos:Pos) => (board: Board) => {
  return pos.x <= 7 && pos.x >= 0 && pos.y <= 7 && pos.y >= 0 ? pos : null
}

const validIfNoFriend = (pos:Pos) => (board: Board) => {
  const piece = board.pieces.find(p => p.x === pos.x && p.y === pos.y)
  const isFriend = piece && !piece.foe
  return !isFriend ? pos : null
}

export enum PieceType {
  Pawn, Knigth, Rook, Bishop, Queen, King
}
export const pieceTypeByName = (str:string) => {
  switch (str.toLowerCase()) {
    case 'b': return PieceType.Bishop;
    case 'k': return PieceType.King;
    case 'n': return PieceType.Knigth;
    case 'r': return PieceType.Rook;
    case 'q': return PieceType.Queen;
    case 'p': return PieceType.Pawn;
    default: null
  }
}


interface Pos {
  x: number,
  y: number,
}
export interface Piece {
  x: number, 
  y: number, 
  foe?: boolean,
  type: PieceType
}
export interface Board {
  pieces: Piece[];// pieces on board
  passant?: number; //did foe an en'passant on last move?
  castlePosible?: boolean; //is still posible to castle?
}

export const moves: {[k:string]:(p:Pos)=>D[]} = {
  p: ({x,y}) => [
    validIfEmpty({x,y:y+1}),
    validOr(validIfPassant, validIfEnemy)({x:x+1,y:y+1}),
    validOr(validIfPassant, validIfEnemy)({x:x-1,y:y+1}),
    validAll(validIfEmpty({x,y:y+1}), validIfEmptyAndPassant({x,y:y+2})),
  ]
   .map(x => validAnd(x,validIfNoFriend))
   .map(x => validAnd(x,validIfKingSafe))
   .map(x => validAnd(x,validIfInside))
  ,
  n: ({x,y}) => [
    ({x:x+1,y:y+2}),
    ({x:x+1,y:y-2}),
    ({x:x-1,y:y+2}),
    ({x:x-1,y:y-2}),
    ({x:x+2,y:y+1}),
    ({x:x+2,y:y-1}),
    ({x:x-2,y:y+1}),
    ({x:x-2,y:y-1}),
  ].map(x => validIfNoFriend(x))
   .map(x => validAnd(x,validIfKingSafe))
   .map(x => validAnd(x,validIfInside)),
  r: ({x,y}) => {
    const xs = Array.from({ length: 7 }, (v, i) => ({x,y:(y+i+1)%8}))
    const ys = Array.from({ length: 7 }, (v, i) => ({y,x:(x+i+1)%8}))
    return [...ys,...xs]
      .map(x => validIfNoFriend(x))
      .map(x => validAnd(x,validIfKingSafe))
      .map(x => validAnd(x,validIfInside))
  },
  b: ({x,y}) => {
    const d1 = Array.from({ length: Math.min(x  ,  y) }, (v, i) => ({x:(x-i)-1,y:(y-i)-1}))
    const d4 = Array.from({ length: Math.min(7-x,7-y) }, (v, i) => ({x:(x+i)+1,y:(y+i)+1}))

    const d2 = Array.from({ length: Math.min(7-x,  y) }, (v, i) => ({x:(x+i)+1,y:(y-i)-1}))
    const d3 = Array.from({ length: Math.min(x  ,7-y) }, (v, i) => ({x:(x-i)-1,y:(y+i)+1}))
    return [...d1,...d2,...d3,...d4]
      .map(x => validIfNoFriend(x))
      .map(x => validAnd(x,validIfKingSafe))
      .map(x => validAnd(x,validIfInside))
  },
  q: ({x,y}) => {
    const xs = Array.from({ length: 7 }, (v, i) => ({x,y:(y+i+1)%8}))
    const ys = Array.from({ length: 7 }, (v, i) => ({y,x:(x+i+1)%8}))
    const d1 = Array.from({ length: Math.min(7-x,7-y) }, (v, i) => ({x:(x+i)+1,y:(y+i)+1}))
    const d2 = Array.from({ length: Math.min(7-x,  y) }, (v, i) => ({x:(x+i)+1,y:(y-i)-1}))
    const d3 = Array.from({ length: Math.min(x  ,7-y) }, (v, i) => ({x:(x-i)-1,y:(y+i)+1}))
    const d4 = Array.from({ length: Math.min(x  ,  y) }, (v, i) => ({x:(x-i)-1,y:(y-i)-1}))
    return [...ys,...xs,...d1,...d2,...d3,...d4]
      .map(x => validIfNoFriend(x))
      .map(x => validAnd(x,validIfKingSafe))
      .map(x => validAnd(x,validIfInside))
  },
  k: ({x,y}) => [
    ({x:x+1,y:y+1}),
    ({x:x+1,y    }),
    ({x:x+1,y:y-1}),
    ({x    ,y:y-1}),
    ({x:x-1,y:y-1}),
    ({x:x-1,y    }),
    ({x:x-1,y:y+1}),
    ({x    ,y:y+1}),
  ]
    .map(x => validIfNoFriend(x))
    .map(x => validAnd(x,validIfKingSafe))
    .map(x => validAnd(x,validIfInside)),
}

export const swap = ({x,y}:{x:number,y:number}, swap: boolean) => ({x,y: swap ? y : 7-y})

