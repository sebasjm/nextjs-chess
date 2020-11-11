import { expect } from 'chai';
import pieces from '../src/pieces';
import { moves, Board, Piece, pieceTypeByName } from '../src/logic';
import 'mocha';

//asume white are foe
const buildPiece = (name:string):Piece => ({
  x: name.codePointAt(2) - '0'.codePointAt(0),
  y: name.codePointAt(3) - '0'.codePointAt(0),
  foe: name.charAt(0) === name.charAt(0).toLocaleLowerCase(),
  type: pieceTypeByName(name.charAt(0))
})
// knigth({x,y}).map( m => m(pieces) ).filter(Boolean)

// normalized board
const { 
  p: pawn,
  n: knigth,
  q: queen,
  k: king,
  r: rook,
  b: bishop,
} = moves

describe('chess moves with empty board, second algorithm', function() {

  describe('pawn moves', function() {
    it('should have two moves when starts alone', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([{x:1,y:2},{x:1,y:3}])
    });

    it('should have one move when alone', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = pawn({x:3,y:2}).map( m => m(board)).filter(Boolean)

      expect(ms).to.have.deep.members([{x:3,y:3}])
    });


    it('should have two moves when starts and can eat diagonally', function() {
      const board:Board = {
        pieces: ['p:02','p:22'].map(buildPiece)
      }
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:1,y:2},{x:1,y:3},{x:0,y:2},{x:2,y:2}
      ])
    });

    it('should be blocked with an enemy in front', function() {
      const board:Board = {
        pieces: ['q:33'].map(buildPiece)
      }

      const ms = pawn({x:3,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([])
    });

    it('should be blocked the passant move with an enemy in front', function() {
      const board:Board = {
        pieces: ['q:12'].map(buildPiece)
      }
      
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([])
    });

    it('should still valid to eat with a block in front', function() {
      const board:Board = {
        pieces: ['q:12','q:22'].map(buildPiece)
      }
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([{x:2,y:2}])
    });

    it('should be able to eat after enemy did passant', function() {
      const board:Board = {
        pieces: ['p:55'].map(buildPiece),
        passant: 5    
      }
      const ms = pawn({x:4,y:5}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:6},{x:5,y:6}
      ])
    });

    it('should not eat if enemy did passant but is far', function() {
      const board:Board = {
        pieces: ['p:55','p:15'].map(buildPiece),
        passant: 1
      }
      const ms = pawn({x:4,y:5}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:6}
      ])
    });

    it('should not eat if enemy did not passant', function() {
      const board:Board = {
        pieces: ['p:55','p:15'].map(buildPiece),
      }
      const ms = pawn({x:4,y:5}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:6}
      ])
    });

    it('should still valid to eat with a block in front', function() {
      const board:Board = {
        pieces: ['q:12','q:22'].map(buildPiece)
      }
      const ms = pawn({x:1,y:1}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([{x:2,y:2}])
    });

    it('should not go outside the board', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = pawn({x:7,y:7}).map( m => m(board)).filter(Boolean)

      expect(ms).to.have.deep.members([])
    });

    it.skip('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: ['r:14','k:54'].map(buildPiece)
      }
      const ms = pawn({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
      ])
    });
  });

  describe('knigth moves', function() {
    it('should have eigth moves', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = knigth({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:6,y:5},{x:6,y:3},
        {x:2,y:5},{x:2,y:3},
        {x:5,y:6},{x:5,y:2},
        {x:3,y:6},{x:3,y:2},
      ])
    });
    it('should not allow outside the board', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = knigth({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:6,y:4},{x:6,y:0},
        {x:5,y:3},{x:5,y:1},
      ])
    });

    it('should not fall into a friend', function() {
      const board:Board = {
        pieces: ['P:60'].map(buildPiece)
      }
      const ms = knigth({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:6,y:4},
        {x:5,y:3},{x:5,y:1},
      ])
    });

    it('should not be blocked and eat', function() {
      const board:Board = {
        pieces: ['p:60','P:71','P:61','P:51'].map(buildPiece)
      }
      const ms = knigth({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:6,y:4},{x:6,y:0},
        {x:5,y:3},
      ])
    });

    it.skip('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: ['r:14','k:54'].map(buildPiece)
      }
      const ms = knigth({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
      ])
    });
  });

  describe('king moves', function() {
    it('should have eigth moves', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = king({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:5,y:5},{x:5,y:4},
        {x:5,y:3},{x:4,y:3},
        {x:3,y:3},{x:3,y:4},
        {x:3,y:5},{x:4,y:5},
      ])
    });

    it('should not allow outside the board', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = king({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:7,y:1},{x:6,y:1},
        {x:6,y:2},{x:6,y:3},
        {x:7,y:3},
      ])
    });

    it('should eat foes but be blocked by friends', function() {
      const board:Board = {
        pieces: ['p:71','P:73'].map(buildPiece)
      }
      const ms = king({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:7,y:1},{x:6,y:1},
        {x:6,y:2},{x:6,y:3},
      ])
    });

    it.skip('should not eat guarded enemy', function() {
      const board:Board = {
        pieces: ['p:71','r:41'].map(buildPiece)
      }
      const ms = king({x:7,y:2}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
                  {x:6,y:1},
        {x:6,y:2},{x:6,y:3},
        {x:7,y:3},
      ])
    });

  });

  describe('rook moves', function() {
    it('should have 14 moves', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = rook({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:5},{x:4,y:6},{x:4,y:7},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        {x:5,y:4},{x:6,y:4},{x:7,y:4},
      ])
    });

    it.skip('should be blocked by friends and exclude position', function() {
      const board:Board = {
        pieces: ['P:46','P:54'].map(buildPiece)
      }
      const ms = rook({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:5},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        
      ])
    });

    it.skip('should be blocked by enemies and include position', function() {
      const board:Board = {
        pieces: ['p:46','p:54'].map(buildPiece)
      }
      const ms = rook({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:4,y:5},{x:4,y:6},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        {x:5,y:4},
      ])
    });

    it.skip('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: ['r:14','k:54'].map(buildPiece)
      }
      const ms = rook({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([])
    });
  });

  describe('bishop moves', function() {
    it('should have moves diag from corner', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const ms = bishop({x:0,y:0}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:4,y:4},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
        ])
    });

    it('should have moves diag from center', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
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

    it.skip('should be blocked by friends and exclude position', function() {
      const board:Board = {
        pieces: ['P:33','P:26'].map(buildPiece)
      }
      const ms = bishop({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
        
        {x:0,y:0},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
  
                            {x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
        ])
    });

    it.skip('should be blocked by enemies and include position', function() {
      const board:Board = {
        pieces: ['P:33','P:26'].map(buildPiece)
      }
      const ms = bishop({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([
                            {x:3,y:3},
        {x:0,y:0},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
  
                  {x:2,y:6},{x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
        ])
    });

    it.skip('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: ['r:14','k:54'].map(buildPiece)
      }
      const ms = bishop({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      expect(ms).to.have.deep.members([])
    });
  });

  describe('queen moves', function() {

    it('should have bishop plus rook moves from center', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const pos = {x:4,y:4}
      const q_ms = queen(pos).map( m => m(board)).filter(Boolean) 
      const b_ms = bishop(pos).map( m => m(board)).filter(Boolean) 
      const r_ms = rook(pos).map( m => m(board)).filter(Boolean) 

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

    it('should have bishop plus rook moves from corner', function() {
      const board:Board = {
        pieces: [].map(buildPiece)
      }
      const pos = {x:0,y:0}
      const q_ms = queen(pos).map( m => m(board)).filter(Boolean) 
      const b_ms = bishop(pos).map( m => m(board)).filter(Boolean) 
      const r_ms = rook(pos).map( m => m(board)).filter(Boolean) 

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

    it.skip('should be blocked by friends and exclude position', function() {
      const board:Board = {
        pieces: ['P:33','P:26'].map(buildPiece)
      }
      const pos = {x:4,y:4}
      const q_ms = queen(pos).map( m => m(board)).filter(Boolean) 
      const b_ms = bishop(pos).map( m => m(board)).filter(Boolean) 
      const r_ms = rook(pos).map( m => m(board)).filter(Boolean) 

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

    it.skip('should be blocked by enemies and include position', function() {
      const board:Board = {
        pieces: ['P:33','P:26'].map(buildPiece)
      }
      const ms = queen({x:4,y:4}).map( m => m(board)).filter(Boolean) 

      const pos = {x:4,y:4}
      const q_ms = queen(pos).map( m => m(board)).filter(Boolean) 
      const b_ms = bishop(pos).map( m => m(board)).filter(Boolean) 
      const r_ms = rook(pos).map( m => m(board)).filter(Boolean) 

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

  });
});
