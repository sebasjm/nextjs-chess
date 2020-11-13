import BlackKnight from "../pieces/BlackKnight"

export const findPieceAtPosition = ({ pieces, pos }) => {
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]
    if (piece.indexOf(pos) === 2) {
      return { notation: piece, name: piece.slice(0, 1), index: i, position: pos }
    }
  }

  return null
}

type F = (move:Delta) => (pos:Piece, board: Board) => IsMoveValid

type D = (pos:Piece, board: Board) => IsMoveValid

//TODO: this could be better, like validAnd
const validOr = (cond1:F, cond2:F) => (move:Delta) => (pos:Piece, board: Board):IsMoveValid => {
  const xy1 = cond1(move)(pos,board)
  return xy1 ? xy1 : cond2(move)(pos,board)
}

const validAnd = (cond1:D, cond2:F) => (pos:Piece, board: Board):IsMoveValid => {
  const p = cond1(pos,board)
  if (!p) return null
  return cond2(p[0])(p[1],board)
}

const validTrue:D = (pos, board)=> ({} as any)
const validFalse:D = (pos, board)=> (null as any)

const validAll = (...conds:D[]) => (pos:Piece, board: Board):IsMoveValid => {
  return conds.reduce((prev,val) => !prev(pos,board)? validFalse : val, validTrue)(pos,board)
}

// for the pawn
const validIfEnemy = (move:Delta) => (pos:Piece, board: Board):IsMoveValid => {
  const [x,y] = move
  const piece = board.pieces.find(p => p.x === pos.x+x && p.y === pos.y+y)
  return piece && piece.foe ? [move,pos,board] : null
}

// for the bishop, rogue, queen
const validIfEmpty = (move:Delta) => (pos:Piece, board: Board):IsMoveValid => {
  const [x,y] = move
  const piece = board.pieces.find(p => p.x === pos.x+x && p.y === pos.y+y)
  return !piece ? [move,pos,board] : null
}

const validIfEmptyAndPassant = (move:Delta) => (pos:Piece, board: Board):IsMoveValid => {
  const [x,y] = move
  const piece = board.pieces.find(p => p.x === pos.x+x && p.y === pos.y+y)
  return !piece && pos.y+y === 3 ? [move,pos,board] : null
}

// for the pawn
const validIfPassant = (move:Delta) => (pos:Piece, board: Board):IsMoveValid => {
  const [x,y] = move
  const piece = board.pieces.find(p => p.x === pos.x+x && p.y === pos.y+y-1)
  const isEnemy = piece && piece.foe

  return isEnemy && board.passant === piece.x ? [move,pos,board] : null
}

const validIfKingSafe = (move:Delta) => (piece:Piece, board: Board):IsMoveValid => {
  const orig = piece
  const dest = {x:piece.x + move[0], y:piece.y + move[1]}
  const king = piece.type == PieceType.King ? dest : board.pieces.find(p => !p.foe && p.type === PieceType.King)
  if (!king) return [move,piece,board] // we are safe if there is no king in the board

  const enemyBoard:Board = {
    pieces: [...board.pieces
      .filter( e => (e.x !== orig.x || e.y !== orig.y) && (e.x !== dest.x || e.y !== dest.y))
      .map( p => ({
          x: p.x,
          y: 7-p.y,
          type: p.type,
          foe: !p.foe
        })
      ),({
        x: dest.x,
        y: 7-dest.y,
        type: piece.type,
        foe: true
      })
    ],
    // FIXME: should it calculate passant?
  }
  const foes = enemyBoard.pieces.filter( p => !p.foe )
  const safe = !foes.find( foe => {
    const attackOfFoe = movesByType[foe.type](foe,enemyBoard)
    const check = !!attackOfFoe.find( p => p.x === king.x && p.y === 7-king.y)
    return check
  } )

  return safe ? [move,piece,board] : null
}

const validIfInside = (move:Delta) => (pos:Piece, board: Board):IsMoveValid => {
  const x = pos.x + move[0]
  const y = pos.y + move[1]
  return x <= 7 && x >= 0 && y <= 7 && y >= 0 ? [move,pos,board] : null
}

const validIfNoFriend = (move:Delta) => (pos:Piece, board: Board):IsMoveValid =>  {
  const [x,y] = move
  const piece = board.pieces.find(p => p.x === pos.x+x && p.y === pos.y+y)
  const isFriend = piece && !piece.foe
  return !isFriend ? [move,pos,board] : null
}

type IsMoveValid = [move:Delta, pos:Piece, board: Board] | null
type Delta = [x:number,y:number]

interface Pos {
  x: number,
  y: number,
}

export enum PieceType {
  Pawn, Knigth, Rook, Bishop, Queen, King
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

const sevenWith = (f: (i:number) => Delta) => Array.from({ length: 7 }, (v, i) => f(i))

const buildValidator = (type: PieceType,moveValidators: D[]) => (pos:Piece, board:Board):Pos[] => 
  moveValidators
    .map( v => v({...pos, type},board))
    .filter(Boolean)
    .map( r => ({
      x: r[1].x + r[0][0],
      y: r[1].y + r[0][1],
    }))


export const moves: {[k:string]: ((pos:Pos, board:Board) => Pos[])} = {
  p: buildValidator(PieceType.Pawn, [
    validIfEmpty([0,1]),
    validOr(validIfPassant, validIfEnemy)([1,1]),
    validOr(validIfPassant, validIfEnemy)([-1,1]),
    validAll(validIfEmpty([0,1]), validIfEmptyAndPassant([0,2])),
  ]
   .map(x => validAnd(x,validIfNoFriend))
   .map(x => validAnd(x,validIfKingSafe))
   .map(x => validAnd(x,validIfInside)))
  ,
  n: buildValidator(PieceType.Knigth, ([
    [+1,+2],
    [+1,-2],
    [-1,+2],
    [-1,-2],
    [+2,+1],
    [+2,-1],
    [-2,+1],
    [-2,-1],
  ] as Delta[])
   .map(x => validIfNoFriend(x))
   .map(x => validAnd(x,validIfKingSafe))
   .map(x => validAnd(x,validIfInside))),
  r: buildValidator(PieceType.Rook, [
    ...sevenWith( i => [   0, i+1]),
    ...sevenWith( i => [ i+1,   0]),
    ...sevenWith( i => [-i-1,   0]),
    ...sevenWith( i => [   0,-i-1]),
  ]
      .map(x => validIfNoFriend(x))
      .map(x => validAnd(x,validIfKingSafe))
      .map(x => validAnd(x,validIfInside)))
  ,
  b: buildValidator(PieceType.Bishop, [
    ...sevenWith( i => [ i+1, i+1]),
    ...sevenWith( i => [ i+1,-i-1]),
    ...sevenWith( i => [-i-1, i+1]),
    ...sevenWith( i => [-i-1,-i-1])
  ]
      .map(x => validIfNoFriend(x))
      .map(x => validAnd(x,validIfKingSafe))
      .map(x => validAnd(x,validIfInside)))
  ,
  q: buildValidator(PieceType.Queen, [
      ...sevenWith( i => [   0, i+1]),
      ...sevenWith( i => [ i+1,   0]),
      ...sevenWith( i => [-i-1,   0]),
      ...sevenWith( i => [   0,-i-1]),
      ...sevenWith( i => [ i+1, i+1]),
      ...sevenWith( i => [ i+1,-i-1]),
      ...sevenWith( i => [-i-1, i+1]),
      ...sevenWith( i => [-i-1,-i-1])
      ]    
      .map(x => validIfNoFriend(x))
      .map(x => validAnd(x,validIfKingSafe))
      .map(x => validAnd(x,validIfInside)))
  ,
  k: buildValidator(PieceType.King, ([
    [+1,+1],
    [+1, 0],
    [+1,-1],
    [ 0,-1],
    [-1,-1],
    [-1, 0],
    [-1,+1],
    [ 0,+1],
  ] as Delta[])
    .map(x => validIfNoFriend(x))
    .map(x => validAnd(x,validIfKingSafe))
    .map(x => validAnd(x,validIfInside))),
}

export const swap = ({x,y}:{x:number,y:number}, swap: boolean) => ({x,y: swap ? y : 7-y})

const movesByType = [
  moves.p,
  moves.n,
  moves.r,
  moves.b,
  moves.q,
  moves.k,
]

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

