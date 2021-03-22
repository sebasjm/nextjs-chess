import { expect } from 'chai';
import 'mocha';
import { translateFen, translatePieces } from '../src/logic';

describe('fen', function() {

  it('should load an empty board', function() {
    const fen = translateFen("8/8/8/8/8/8/8/8")
    const board = translatePieces([
      
    ])
    expect(fen).to.have.deep.members(board)
  });

})
