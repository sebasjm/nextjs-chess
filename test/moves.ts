import { expect } from 'chai';
import pieces from '../src/pieces';
import { movesOld as moves } from '../src/logic';
import 'mocha';

const { 
  p: pawn,
  n: knigth,
  q: queen,
  k: king,
  r: rook,
  b: bishop,
} = moves

describe('chess moves with empty board', function() {

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
