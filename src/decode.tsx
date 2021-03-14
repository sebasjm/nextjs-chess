// const charCodeOffset = 97

export default {
  fromPieceDecl: pos => {
    const [piece, square] = pos.split('@')
    const x = square.toLowerCase().charCodeAt(0) - 'a'.codePointAt(0)
    const y = Number(square[1]) - 1
    return {x, y, piece, square}
  },

  // charCodeOffset
}
