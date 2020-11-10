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

const validOr = (cond1, cond2) => xy => (pieces:string[], s:boolean, passant?: string) => {
  const xy1 = cond1(xy)(pieces, s, passant)
  return xy1 ? xy1 : cond2(xy)(pieces, s, passant)
}

const trueVal = ()=>({})

const validAll = (...conds) => (pieces:string[], s:boolean, passant?: string) => {
  return conds.reduce((prev,val) => prev && val(pieces, s, passant), trueVal)
}

// for the pawn
const validIfEnemy = (xy) => (pieces:string[], s:boolean, passant?: string) => {
  if (!xy) return null
  const pos = fromXY(swap(xy, s))
  const piece = findPieceAtPosition({pieces, pos})
  const isEnemy = piece && !isWhite(piece.notation) && s
  return isEnemy ? xy : null
}

// for the bishop, rogue, queen
const validIfEmpty = (xy) => (pieces:string[], s:boolean, passant?: string) => {
  if (!xy) return null
  const pos = fromXY(swap(xy, s))
  const piece = findPieceAtPosition({pieces, pos})
  return !piece ? xy : null
}

// for the pawn
const validIfPassant = (xy) => (pieces:string[], s:boolean, passant?: string) => {
  if (!xy) return null
  const pos = fromXY(swap({x:xy.x,y:xy.y-1}, s))
  const piece = findPieceAtPosition({pieces, pos})
  const isEnemy = piece && !isWhite(piece.notation) && s

  //TODO: check pasant position
  return isEnemy && passant ? xy : null
}

const validIfKingSafe = (xy) => (pieces:string[], s:boolean, passant?: string) => {
  if (!xy) return null
  const pos = fromXY(swap({x:xy.x,y:xy.y-1}, s))
  const piece = findPieceAtPosition({pieces, pos})
  return !piece && isWhite(piece.notation) && s ? xy : null
}

const validIfInside = (xy) => (pieces:string[], s:boolean, passant?: string) => {
  if (!xy) return null
  const pos = fromXY(swap({x:xy.x,y:xy.y-1}, s))
  const piece = findPieceAtPosition({pieces, pos})
  return !piece && isWhite(piece.notation) && s ? xy : null
}

const validIfNoFriend = (xy) => (pieces:string[], s:boolean, passant?: string) => {
  if (!xy) return null
  const pos = fromXY(swap(xy, s))
  const piece = findPieceAtPosition({pieces, pos})
  const isFriend = piece && isWhite(piece.notation) && s
  return !isFriend ? xy : null
}

export const movesNew = {
  p: ({x,y}) => [
    validIfEmpty({x,y:y+1}),
    validOr(validIfPassant, validIfEnemy)({x:x+1,y:y+1}),
    validOr(validIfPassant, validIfEnemy)({x:x+1,y:y+1}),
    validAll(validIfEmpty({x,y:y+1}), validIfEmpty({x,y:y+2})),
  ].map(x => validIfNoFriend(x)).map(x => validIfKingSafe(x)).map(x => validIfInside(x)),
  n: ({x,y}) => [
    ({x:x+1,y:y+2}),
    ({x:x+1,y:y-2}),
    ({x:x-1,y:y+2}),
    ({x:x-1,y:y-2}),
    ({x:x+2,y:y+1}),
    ({x:x+2,y:y-1}),
    ({x:x-2,y:y+1}),
    ({x:x-2,y:y-1}),
  ].map(x => validIfNoFriend(x)).map(x => validIfKingSafe(x)).map(x => validIfInside(x)),
  r: ({x,y}) => {
    const xs = Array.from({ length: 7 }, (v, i) => ({x,y:(y+i+1)%8}))
    const ys = Array.from({ length: 7 }, (v, i) => ({y,x:(x+i+1)%8}))
    return [...ys,...xs]
  },
  b: ({x,y}) => {
    const d1 = Array.from({ length: Math.min(x  ,  y) }, (v, i) => ({x:(x-i)-1,y:(y-i)-1}))
    const d4 = Array.from({ length: Math.min(7-x,7-y) }, (v, i) => ({x:(x+i)+1,y:(y+i)+1}))

    const d2 = Array.from({ length: Math.min(7-x,  y) }, (v, i) => ({x:(x+i)+1,y:(y-i)-1}))
    const d3 = Array.from({ length: Math.min(x  ,7-y) }, (v, i) => ({x:(x-i)-1,y:(y+i)+1}))
    return [...d1,...d2,...d3,...d4]
  },
  q: ({x,y}) => {
    const xs = Array.from({ length: 7 }, (v, i) => ({x,y:(y+i+1)%8}))
    const ys = Array.from({ length: 7 }, (v, i) => ({y,x:(x+i+1)%8}))
    const d1 = Array.from({ length: Math.min(7-x,7-y) }, (v, i) => ({x:(x+i)+1,y:(y+i)+1}))
    const d2 = Array.from({ length: Math.min(7-x,  y) }, (v, i) => ({x:(x+i)+1,y:(y-i)-1}))
    const d3 = Array.from({ length: Math.min(x  ,7-y) }, (v, i) => ({x:(x-i)-1,y:(y+i)+1}))
    const d4 = Array.from({ length: Math.min(x  ,  y) }, (v, i) => ({x:(x-i)-1,y:(y-i)-1}))
    return [...ys,...xs,...d1,...d2,...d3,...d4]
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
  ].map(x => validIfNoFriend(x)).map(x => validIfKingSafe(x)).map(x => validIfInside(x)),
}

export const swap = ({x,y}:{x:number,y:number}, swap: boolean) => ({x,y: swap ? y : 7-y})



export const movesOld = {
  p: ({x,y}) => [
    y < 7  ? ({x,y:y+1}) : null,
    x < 7 && y < 7 ? ({x:x+1,y:y+1}) : null,
    x > 0 && y < 7 ? ({x:x-1,y:y+1}) : null,
    y == 1 ? ({x,y:y+2}) : null,
  ].filter(Boolean),
  n: ({x,y}) => [
    x < 7 && y < 6 ? ({x:x+1,y:y+2}) : null,
    x < 7 && y > 1 ? ({x:x+1,y:y-2}) : null,
    x > 0 && y < 6 ? ({x:x-1,y:y+2}) : null,
    x > 0 && y > 1 ? ({x:x-1,y:y-2}) : null,
    x < 7 && y < 6 ? ({x:x+2,y:y+1}) : null,
    x < 7 && y > 1 ? ({x:x+2,y:y-1}) : null,
    x > 0 && y < 6 ? ({x:x-2,y:y+1}) : null,
    x > 0 && y > 1 ? ({x:x-2,y:y-1}) : null,
  ].filter(Boolean),
  r: ({x,y}) => {
    const xs = Array.from({ length: 7 }, (v, i) => ({x,y:(y+i+1)%8}))
    const ys = Array.from({ length: 7 }, (v, i) => ({y,x:(x+i+1)%8}))
    return [...ys,...xs]
  },
  b: ({x,y}) => {
    // const st = Math.min(x  ,  y)
    // const dt = Math.min(7-x,7-y)
    // const d1 = Array.from({ length: dt + st }, (v, i) => ({
    //   x:(x-st+(st+1+i)%(st+dt+1)),
    //   y:(y-st+(st+1+i)%(st+dt+1))
    // }))
    const d1 = Array.from({ length: Math.min(x  ,  y) }, (v, i) => ({x:(x-i)-1,y:(y-i)-1}))
    const d4 = Array.from({ length: Math.min(7-x,7-y) }, (v, i) => ({x:(x+i)+1,y:(y+i)+1}))

    const d2 = Array.from({ length: Math.min(7-x,  y) }, (v, i) => ({x:(x+i)+1,y:(y-i)-1}))
    const d3 = Array.from({ length: Math.min(x  ,7-y) }, (v, i) => ({x:(x-i)-1,y:(y+i)+1}))
    return [...d1,...d2,...d3,...d4]
  },
  q: ({x,y}) => {
    const xs = Array.from({ length: 7 }, (v, i) => ({x,y:(y+i+1)%8}))
    const ys = Array.from({ length: 7 }, (v, i) => ({y,x:(x+i+1)%8}))
    const d1 = Array.from({ length: Math.min(7-x,7-y) }, (v, i) => ({x:(x+i)+1,y:(y+i)+1}))
    const d2 = Array.from({ length: Math.min(7-x,  y) }, (v, i) => ({x:(x+i)+1,y:(y-i)-1}))
    const d3 = Array.from({ length: Math.min(x  ,7-y) }, (v, i) => ({x:(x-i)-1,y:(y+i)+1}))
    const d4 = Array.from({ length: Math.min(x  ,  y) }, (v, i) => ({x:(x-i)-1,y:(y-i)-1}))
    return [...ys,...xs,...d1,...d2,...d3,...d4]
  },
  k: ({x,y}) => [
    x < 7 && y < 7 ? ({x:x+1,y:y+1}) : null,
    x < 7          ? ({x:x+1,y    }) : null,
    x < 7 && y > 0 ? ({x:x+1,y:y-1}) : null,
             y > 0 ? ({x    ,y:y-1}) : null,
    x > 0 && y > 0 ? ({x:x-1,y:y-1}) : null,
    x > 0          ? ({x:x-1,y    }) : null,
    x > 0 && y < 7 ? ({x:x-1,y:y+1}) : null,
             y < 7 ? ({x    ,y:y+1}) : null,
  ].filter(Boolean),
}
