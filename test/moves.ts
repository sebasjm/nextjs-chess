import { expect } from 'chai';
import { move, Board, Piece, pieceTypeByName, PieceType } from '../src/logic';
import 'mocha';

//asume white are foe
const buildPiece = (name:string):Piece => ({
  x: name.codePointAt(2) - '0'.codePointAt(0),
  y: name.codePointAt(3) - '0'.codePointAt(0),
  group: name.charAt(0) === name.charAt(0).toLocaleLowerCase(),
  type: pieceTypeByName(name.charAt(0))
})

const buildPieces = (piecesName: string[]):Piece[] => {
  const emptyBoard = Array(8*8);
  piecesName.map(buildPiece).forEach(p => {
    emptyBoard[p.x+p.y*8] = p
  })
  return emptyBoard
}

function justPosition(p:Piece) {
  return {x:p.x,y:p.y}
}

describe('chess moves', function() {

  describe('pawn moves', function() {
    it('should have two moves when starts alone', function() {
      const board:Board = {
        pieces: buildPieces(['P:11'])
      }
      const ms = move({x:1,y:1},board)

      expect(ms.map(justPosition)).to.have.deep.members([{x:1,y:2},{x:1,y:3}])
    });

    it('should have one move when alone', function() {
      const board:Board = {
        pieces: buildPieces(['p:32']),
      }
      const ms = move({x:3,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([{x:3,y:3}])
    });


    it('should have two moves when starts and can eat diagonally', function() {
      const board:Board = {
        pieces: buildPieces(['p:02','p:22','P:11']),
      }
      const ms = move({x:1,y:1},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:1,y:2},{x:1,y:3},{x:0,y:2},{x:2,y:2}
      ])
    });

    it('should be blocked with an enemy in front', function() {
      const board:Board = {
        pieces: buildPieces(['q:33','p:32']),
      }

      const ms = move({x:3,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([])
    });

    it('should be blocked the passant move with an enemy in front', function() {
      const board:Board = {
        pieces: buildPieces(['q:12','p:11']),
      }
      
      const ms = move({x:1,y:1},board)

      expect(ms.map(justPosition)).to.have.deep.members([])
    });

    it('should still valid to eat with a block in front', function() {
      const board:Board = {
        pieces: buildPieces(['q:12','q:22','p:11']),
      }
      const ms = move({x:1,y:1},board)

      expect(ms.map(justPosition)).to.have.deep.members([{x:2,y:2}])
    });

    it('should be able to eat after enemy did passant', function() {
      const board:Board = {
        pieces: buildPieces(['p:55','p:45']),
        passant: 5    
      }
      const ms = move({x:4,y:5},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:4,y:6},{x:5,y:6}
      ])
    });

    it('should not eat if enemy did passant but is far', function() {
      const board:Board = {
        pieces: buildPieces(['p:55','p:15','p:45']),
        passant: 1
      }
      const ms = move({x:4,y:5},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:4,y:6}
      ])
    });

    it('should not eat if enemy did not passant', function() {
      const board:Board = {
        pieces: buildPieces(['p:55','p:15','p:45']),
      }
      const ms = move({x:4,y:5},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:4,y:6}
      ])
    });

    it('should still valid to eat with a block in front', function() {
      const board:Board = {
        pieces: buildPieces(['q:12','q:22','p:11']),
      }
      const ms = move({x:1,y:1},board)

      expect(ms.map(justPosition)).to.have.deep.members([{x:2,y:2}])
    });

    it('should not go outside the board', function() {
      const board:Board = {
        pieces: buildPieces(['p:77']),
      }
      const ms = move({x:7,y:7},board)

      expect(ms.map(justPosition)).to.have.deep.members([])
    });

    it('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: buildPieces(['r:14','K:54','p:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
      ])
    });
  });

  describe('knigth moves', function() {
    it('should have eigth moves', function() {
      const board:Board = {
        pieces: buildPieces(['n:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:6,y:5},{x:6,y:3},
        {x:2,y:5},{x:2,y:3},
        {x:5,y:6},{x:5,y:2},
        {x:3,y:6},{x:3,y:2},
      ])
    });
    it('should not allow outside the board', function() {
      const board:Board = {
        pieces: buildPieces(['n:72']),
      }
      const ms = move({x:7,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:6,y:4},{x:6,y:0},
        {x:5,y:3},{x:5,y:1},
      ])
    });

    it('should not fall into a friend', function() {
      const board:Board = {
        pieces: buildPieces(['P:60','n:72']),
      }
      const ms = move({x:7,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:6,y:4},
        {x:5,y:3},{x:5,y:1},
      ])
    });

    it('should not be blocked and eat', function() {
      const board:Board = {
        pieces: buildPieces(['p:60','P:71','P:61','P:51','n:72']),
      }
      const ms = move({x:7,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:6,y:4},{x:6,y:0},
        {x:5,y:3},
      ])
    });

    it('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: buildPieces(['r:14','K:54','n:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
      ])
    });
  });

  describe('king moves', function() {
    it('should have eigth moves', function() {
      const board:Board = {
        pieces: buildPieces(['k:44']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:5,y:5},{x:5,y:4},
        {x:5,y:3},{x:4,y:3},
        {x:3,y:3},{x:3,y:4},
        {x:3,y:5},{x:4,y:5},
      ])
    });

    it('should not allow outside the board', function() {
      const board:Board = {
        pieces: buildPieces(['k:72']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:7,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:7,y:1},{x:6,y:1},
        {x:6,y:2},{x:6,y:3},
        {x:7,y:3},
      ])
    });

    it('should eat foes but be blocked by friends', function() {
      const board:Board = {
        pieces: buildPieces(['p:71','P:73','k:72']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:7,y:2},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:7,y:1},{x:6,y:1},
        {x:6,y:2},{x:6,y:3},
      ])
    });

    it('should not eat a guarded enemy by pawn', function() {
      const board:Board = {
        pieces: buildPieces(['P:55','P:46','k:64']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:6,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:5,y:3},
        {x:6,y:3},{x:6,y:5},
        {x:7,y:3},{x:7,y:5},
        {x:5,y:4},{x:7,y:4},
      ])
    });

    it('should not eat guarded enemy by rook', function() {
      const board:Board = {
        pieces: buildPieces(['p:24','r:14','k:64']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:6,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:5,y:3},{x:5,y:5},
        {x:6,y:3},{x:6,y:5},
        {x:7,y:3},{x:7,y:5},
        {x:5,y:4},{x:7,y:4},
      ])
    });

    it('should be able to castle in long', function() {
      const board:Board = {
        pieces: buildPieces(['R:00','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
        {x:2,y:0},
      ])
    });

    it('should not be able to castle in long if has moved the king', function() {
      const board:Board = {
        pieces: buildPieces(['R:00','P:31','P:41','P:51','K:40']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in long if has moved the tower (long side)', function() {
      const board:Board = {
        pieces: buildPieces(['R:00','P:31','P:41','P:51','K:40']),
        castle: { didMoveLongTower: true },
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in long if blocked', function() {
      const board:Board = {
        pieces: buildPieces(['R:00','B:10','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in long if path is attacked (1)', function() {
      const board:Board = {
        pieces: buildPieces(['R:00','r:17','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in long if path is attacked (2)', function() {
      const board:Board = {
        pieces: buildPieces(['R:00','b:76','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should be able to castle in short', function() {
      const board:Board = {
        pieces: buildPieces(['R:70','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
        {x:6,y:0},
      ])
    });

    it('should not be able to castle in short if has moved the king', function() {
      const board:Board = {
        pieces: buildPieces(['R:70','P:31','P:41','P:51','K:40']),
        castle: { didMoveKing: true },
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in short if has moved the tower (short side)', function() {
      const board:Board = {
        pieces: buildPieces(['R:70','P:31','P:41','P:51','K:40']),
        castle: { didMoveShortTower: true },
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in short if blocked', function() {
      const board:Board = {
        pieces: buildPieces(['R:70','B:60','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in short if path is attacked (1)', function() {
      const board:Board = {
        pieces: buildPieces(['R:70','r:67','P:31','P:41','P:51','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

    it('should not be able to castle in short if path is attacked (2)', function() {
      const board:Board = {
        pieces: buildPieces(['R:70','b:15','P:31','P:41','K:40']),
      }
      const ms = move({x:4,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:3,y:0},{x:5,y:0},
      ])
    });

  });

  describe('rook moves', function() {
    it('should have 14 moves', function() {
      const board:Board = {
        pieces: buildPieces(['r:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:4,y:5},{x:4,y:6},{x:4,y:7},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        {x:5,y:4},{x:6,y:4},{x:7,y:4},
      ])
    });

    it('should be blocked by friends and exclude position', function() {
      const board:Board = {
        pieces: buildPieces(['P:46','P:54','r:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:4,y:5},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        
      ])
    });

    it('should be blocked by enemies and include position', function() {
      const board:Board = {
        pieces: buildPieces(['p:46','p:54','r:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:4,y:5},{x:4,y:6},
        {x:4,y:3},{x:4,y:2},{x:4,y:1},{x:4,y:0},
        
        {x:3,y:4},{x:2,y:4},{x:1,y:4},{x:0,y:4},
        {x:5,y:4},
      ])
    });

    it('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: buildPieces(['b:00','K:55','r:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([])
    });

    it('should be able to eat to protect the king', function() {
      const board:Board = {
        pieces: buildPieces(['r:14','K:54','R:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:1, y:4},{x:2, y:4},{x:3, y:4},
      ])
    });
  });

  describe('bishop moves', function() {
    it('should have moves diag from corner', function() {
      const board:Board = {
        pieces: buildPieces(['b:00']),
      }
      const ms = move({x:0,y:0},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:4,y:4},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
        ])
    });

    it('should have moves diag from center', function() {
      const board:Board = {
        pieces: buildPieces(['b:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:1,y:1},{x:2,y:2},{x:3,y:3},
        {x:0,y:0},{x:5,y:5},{x:6,y:6},
        {x:7,y:7},
  
        {x:1,y:7},{x:2,y:6},{x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
        ])
    });

    it('should be blocked by friends and exclude position', function() {
      const board:Board = {
        pieces: buildPieces(['P:33','P:26','b:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        
                  {x:5,y:5},{x:6,y:6},
        {x:7,y:7},
  
                            {x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
        ])
    });

    it('should be blocked by enemies and include position', function() {
      const board:Board = {
        pieces: buildPieces(['p:33','p:26','b:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
                            {x:3,y:3},
                  {x:5,y:5},{x:6,y:6},
        {x:7,y:7},
  
                  {x:2,y:6},{x:3,y:5},
        {x:7,y:1},{x:6,y:2},{x:5,y:3},
        ])
    });

    it('should not move if is protecting the king', function() {
      const board:Board = {
        pieces: buildPieces(['r:14','K:54','B:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([])
    });

    it('should be able to eat to protect the king', function() {
      const board:Board = {
        pieces: buildPieces(['b:00','K:55','B:44']),
      }
      const ms = move({x:4,y:4},board)

      expect(ms.map(justPosition)).to.have.deep.members([
        {x:0, y:0},{x:1, y:1},{x:2, y:2},{x:3, y:3}
      ])
    });
  });

  describe('queen moves', function() {

    it('should have bishop plus rook moves from center', function() {
      const board:Board = {
        pieces: buildPieces(['q:44']),
      }
      const pos = {x:4,y:4}
      const q_ms = move(pos,board).map(justPosition)
      const b_ms = move(pos,{
        pieces: buildPieces(['b:44']),
      }).map(justPosition)
      const r_ms = move(pos,{
        pieces: buildPieces(['r:44']),
      }).map(justPosition)

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

    it('should have bishop plus rook moves from corner', function() {
      const board:Board = {
        pieces: buildPieces(['q:00']),
      }
      const pos = {x:0,y:0}
      const q_ms = move(pos,board).map(justPosition)
      const b_ms = move(pos,{
        pieces: buildPieces(['b:00']),
      }).map(justPosition)
      const r_ms = move(pos,{
        pieces: buildPieces(['r:00']),
      }).map(justPosition)

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

    it('should be blocked by friends and exclude position', function() {
      const board:Board = {
        pieces: buildPieces(['P:33','P:26','Q:44']),
      }
      const pos = {x:4,y:4}
      const q_ms = move(pos,board).map(justPosition)
      const b_ms = move(pos,{
        pieces: buildPieces(['P:33','P:26','B:44']),
      }).map(justPosition)
      const r_ms = move(pos,{
        pieces: buildPieces(['P:33','P:26','R:44']),
      }).map(justPosition)

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

    it('should be blocked by enemies and include position', function() {
      const board:Board = {
        pieces: buildPieces(['p:33','p:26','Q:44']),
      }

      const pos = {x:4,y:4}
      const q_ms = move(pos,board).map(justPosition)
      const b_ms = move(pos,{
        pieces: buildPieces(['p:33','p:26','B:44']),
      }).map(justPosition)
      const r_ms = move(pos,{
        pieces: buildPieces(['p:33','p:26','R:44']),
      }).map(justPosition)

      expect(q_ms).to.have.deep.members([...b_ms, ...r_ms])
    });

  });
  
});

describe('regression test', function() {

  it('should not block pieces when king is covered', function() {
    const board:Board = {
      pieces: buildPieces(['r:14','P:34','K:54','p:66']),
    }
    const ms = move({x:6,y:6},board)

    expect(ms.map(justPosition)).to.have.deep.members([{x:6,y:7}])
  });

  it('should not check through king', function() {
    const board:Board = {
      pieces: buildPieces(['r:14','k:24','K:54','p:34']),
    }
    const ms = move({x:3,y:4},board)

    expect(ms.map(justPosition)).to.have.deep.members([{x:3,y:5}])
  });

  it('should be able to block a pawn', function() {
    const board:Board = {
      pieces: buildPieces(['p:14','r:75','r:07','r:27','K:14']),
    }
    const ms = move({x:1,y:4},board)

    expect(ms.map(justPosition)).to.have.deep.members([
      {x:1,y:3}
    ])
  });
})
