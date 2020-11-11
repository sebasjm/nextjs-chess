import { expect } from 'chai';
import pieces from '../src/pieces';
import { movesOld, movesNew, Board, Piece, PieceType } from '../src/logic';
import 'mocha';

const {Bishop,King,Knigth,Pawn,Queen,Rook} = PieceType

const pieceType = (str:string) => {
  switch (str.toLowerCase()) {
    case 'b': return Bishop;
    case 'k': return King;
    case 'n': return Knigth;
    case 'r': return Rook;
    case 'q': return Queen;
    case 'p': return Pawn;
    default: null
  }
}

//asume white are foe
const buildPiece = (name:string):Piece => ({
  x: name.codePointAt(2) - 'a'.codePointAt(0),
  y: name.codePointAt(3) - '0'.codePointAt(0),
  foe: name.charAt(0) === name.charAt(0).toLocaleLowerCase(),
  type: pieceType(name.charAt(0))
})
// knigth({x,y}).map( m => m(pieces) ).filter(Boolean)

// normalized board

describe('chess moves with empty board', function() {
  const { 
    p: pawn,
    n: knigth,
    q: queen,
    k: king,
    r: rook,
    b: bishop,
  } = movesOld
  
  describe('pawn moves', function() {
    it('should have four moves when starts', function() {
      const ms = pawn({x:1,y:1})

      expect(ms).to.have.deep.members([{x:1,y:2},{x:2,y:2},{x:0,y:2},{x:1,y:3}])
    });

    it('should have one move foward normally', function() {
      const ms = pawn({x:3,y:2})

      expect(ms).to.have.deep.members([{x:3,y:3},{x:2,y:3},{x:4,y:3}])
    });

    it('should not allow outside the board', function() {
      const ms = pawn({x:7,y:2})

      expect(ms).to.have.deep.members([{x:7,y:3},{x:6,y:3}])
    });
  });

  describe('knigth moves', function() {
    it('should have eigth moves', function() {
      const ms = knigth({x:4,y:4})

      expect(ms).to.have.deep.members([
        {x:6,y:5},{x:6,y:3},
        {x:2,y:5},{x:2,y:3},
        {x:5,y:6},{x:5,y:2},
        {x:3,y:6},{x:3,y:2},
      ])
    });
    it('should not allow outside the board', function() {
      const ms = knigth({x:7,y:2})

      expect(ms).to.have.deep.members([
        {x:6,y:4},{x:6,y:0},
        {x:5,y:3},{x:5,y:1},
      ])
    });
  });

  describe('king moves', function() {
    it('should have eigth moves', function() {
      const ms = king({x:4,y:4})

      expect(ms).to.have.deep.members([
        {x:5,y:5},{x:5,y:4},
        {x:5,y:3},{x:4,y:3},
        {x:3,y:3},{x:3,y:4},
        {x:3,y:5},{x:4,y:5},
      ])
    });
    it('should not allow outside the board', function() {
      const ms = king({x:7,y:2})

      expect(ms).to.have.deep.members([
        {x:7,y:1},{x:6,y:1},
        {x:6,y:2},{x:6,y:3},
        {x:7,y:3},
      ])
    });
  });

  describe('rook moves', function() {
    it('should have 14 moves', function() {
      const ms = rook({x:4,y:4})

      expect(ms).to.have.deep.members([
        {x:4,y:5},{x:4,y:6},{x:4,y:7},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        {x:5,y:4},{x:6,y:4},{x:7,y:4},
      ])
    });
  });

  describe('bishop moves', function() {
    it('should have moves diag 1', function() {
      const ms = bishop({x:4,y:4})

      expect(ms).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:0,y:0},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},

        {x:1,y:7},{x:2,y:6},{x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
      ])
    });
    it('should have moves diag 2', function() {
      const ms = bishop({x:0,y:0})

      expect(ms).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:4,y:4},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
      ])
    });
  });

  describe('queen moves', function() {
    it('should have bishop plus rook moves 1', function() {
      const pos = {x:4,y:4}
      const q_ms = queen(pos)
      const b_ms = bishop(pos)
      const r_ms = rook(pos)

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });
    it('should have bishop plus rook moves 2', function() {
      const pos = {x:0,y:0}
      const q_ms = queen(pos)
      const b_ms = bishop(pos)
      const r_ms = rook(pos)

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });
  });
});



describe('chess moves with empty board, second algorithm', function() {
  const { 
    p: pawn,
    n: knigth,
    q: queen,
    k: king,
    r: rook,
    b: bishop,
  } = movesNew

  describe('pawn moves', function() {
    it('should have two moves when starts alone', function() {
      const board:Board = {
        pieces: []
      }
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([{x:1,y:2},{x:1,y:3}])
    });

    it.skip('should have two moves when starts and can eat diagonally', function() {
      const board:Board = {
        pieces: ['p@b3','p@b1'].map(buildPiece)
      }
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([])
    });

    it.skip('should have one move foward normally', function() {
      const board:Board = {
        pieces: []
      }

      const ms = pawn({x:3,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([])
    });

    it.skip('should not allow outside the board', function() {
      const board:Board = {
        pieces: []
      }
      const ms = pawn({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([{x:7,y:3},{x:6,y:3}])
    });
  });

  describe.skip('knigth moves', function() {
    it.skip('should have eigth moves', function() {
      const board:Board = {
        pieces: []
      }
      const ms = knigth({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:6,y:5},{x:6,y:3},
        {x:2,y:5},{x:2,y:3},
        {x:5,y:6},{x:5,y:2},
        {x:3,y:6},{x:3,y:2},
      ])
    });
    it.skip('should not allow outside the board', function() {
      const board:Board = {
        pieces: []
      }
      const ms = knigth({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:6,y:4},{x:6,y:0},
        {x:5,y:3},{x:5,y:1},
      ])
    });
  });

  describe.skip('king moves', function() {
    it.skip('should have eigth moves', function() {
      const board:Board = {
        pieces: []
      }
      const ms = king({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:5,y:5},{x:5,y:4},
        {x:5,y:3},{x:4,y:3},
        {x:3,y:3},{x:3,y:4},
        {x:3,y:5},{x:4,y:5},
      ])
    });
    it.skip('should not allow outside the board', function() {
      const board:Board = {
        pieces: []
      }
      const ms = king({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:7,y:1},{x:6,y:1},
        {x:6,y:2},{x:6,y:3},
        {x:7,y:3},
      ])
    });
  });

  describe.skip('rook moves', function() {
    it.skip('should have 14 moves', function() {
      const board:Board = {
        pieces: []
      }
      const ms = rook({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:5},{x:4,y:6},{x:4,y:7},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        {x:5,y:4},{x:6,y:4},{x:7,y:4},
      ])
    });
  });

  describe.skip('bishop moves', function() {
    it.skip('should have moves diag 1', function() {
      const board:Board = {
        pieces: []
      }
      const ms = bishop({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:0,y:0},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
  
        {x:1,y:7},{x:2,y:6},{x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
        ])
    });
    it.skip('should have moves diag 2', function() {
      const board:Board = {
        pieces: []
      }
      const ms = bishop({x:0,y:0}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:4,y:4},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
        ])
    });
  });

  describe.skip('queen moves', function() {
    it.skip('should have bishop plus rook moves 1', function() {
      const board:Board = {
        pieces: []
      }
      const pos = {x:4,y:4}
      const q_ms = queen(pos).map( m => m(board)).filter(Boolean) 
      const b_ms = bishop(pos).map( m => m(board)).filter(Boolean) 
      const r_ms = rook(pos).map( m => m(board)).filter(Boolean) 

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });
    it.skip('should have bishop plus rook moves 2', function() {
      const board:Board = {
        pieces: []
      }
      const pos = {x:0,y:0}
      const q_ms = queen(pos).map( m => m(board)).filter(Boolean) 
      const b_ms = bishop(pos).map( m => m(board)).filter(Boolean) 
      const r_ms = rook(pos).map( m => m(board)).filter(Boolean) 

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });
  });
});
