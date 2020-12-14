import Head from 'next/head'
import React, { useEffect, useReducer, useState } from 'react';
import Chess, { Dragging, getDefaultLineup } from '../src/react-chess'
// import * as Ably from 'ably'
// import axios from 'axios';
import { orderPieces, Board, move, Piece, pieceTypeByName, swap } from '../src/logic';

interface Props { }
interface State {
  pieces: string[];
  whiteTurn: boolean;
  passant?: number;

}
interface MovePiece {
  type: 'move';
  data: {
    piece: {
      name: string, index: number;
    };
    from: string;
    to: string;
  };
}

type Action = MovePiece;

const handler = { client: null }

function translatePieces(ps:string[], whiteTurn: boolean): Piece[] { return orderPieces(ps.map( name => ({
  x: name.codePointAt(2) - 'a'.codePointAt(0),
  y: (y => whiteTurn ? y : 7-y)(name.codePointAt(3) - '1'.codePointAt(0)),
  group: (whiteTurn === (name.charAt(0) === name.charAt(0).toLocaleLowerCase())?2:3), 
  type: pieceTypeByName(name.charAt(0))
})).filter(Boolean))
}

function toXY(s:string) {
  return {
    x: s.codePointAt(0) - 'a'.codePointAt(0),
    y: s.codePointAt(1) - '1'.codePointAt(0)
  }
}
function fromXY({x,y}:{x:number, y:number}) {
  return String.fromCodePoint('a'.codePointAt(0) + x) + String.fromCharCode('1'.codePointAt(0) + y)
}


function updateState(state: State, action: Action):State {
  switch (action.type) {
    case 'move':
      const {piece, from, to} = action.data

      const board:Board = {
        pieces: translatePieces(state.pieces, state.whiteTurn),
        passant: state.passant
      }

      const orig = swap(toXY(from), state.whiteTurn) 
      const dest = swap(toXY(to), state.whiteTurn) 
      const validMoves = move(orig,board)
        .map(x => fromXY(swap(x,state.whiteTurn))) //translate back position

      if (!validMoves.find( m => m === to)) {
        console.log('invalid move')
        return state
      }

      const newPieces = state.pieces
        .map((curr, index) => {
          if (piece.index === index) {
            return `${piece.name}@${to}`
          } else if (curr.indexOf(to) === 2) {
            return null // To be removed from the board
          }
          return curr
        })
        .filter(Boolean)
      
      return { 
        pieces: newPieces, 
        whiteTurn: !state.whiteTurn, 
        passant: piece.name.toLowerCase() === 'p' && orig.y === 1 && dest.y === 3 ? orig.x : null
      };
    default:
      throw new Error();
  }
}

function resetState():State { return ({
  pieces: getDefaultLineup(),
  whiteTurn: true
})
}

const isWhite = (string) => /^[A-Z]*$/.test(string.charAt(0))

const handleDrag = (state:State) => (d: Dragging): boolean => {
  if (!state.whiteTurn && isWhite(d.notation)) return false
  if (state.whiteTurn && !isWhite(d.notation)) return false
  return true;
}

function Demo() {
  const [state, dispatch] = useReducer(updateState, undefined, resetState)

  const handleMovePiece = (piece, from, to) => {
    dispatch({type: "move", data: {piece, from, to}})
  }

  return (
    <div className="demo" style={{ width: 600 }}>
      <div>juegan {state.whiteTurn ? 'blancas' : 'negras'}</div>

      <Chess  
        whiteTurn={state.whiteTurn} pieces={state.pieces} passant={state.passant}
        onDragStart={handleDrag(state)} 
        onMovePiece={handleMovePiece} />
    </div>
  )
}

export default function Home() {
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
        {/* <meta charset="utf-8" /> */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>ajedrez</title>
      </Head>
      <Demo />
      {/* <button onClick={async () => {
        await axios.post('http://localhost:3001/login', { user: 'seba', password: 'sebasjm' }, { withCredentials: true })

        const client = new Ably.Realtime({
          authCallback: async (params, cb) => {
            const { data: channel } = await axios.post('http://localhost:3001/channel', { }, { withCredentials: true })
            console.log("refresh token", channel.token)
            cb(null, channel.token)
          } 
        });
        handler.client = client

      }}>login</button>

      <button onClick={async () => {
        const channel = handler.client.channels.get('bin-eye-pal');
        channel.subscribe(function(message) {
          console.log("Received: " + message);
        });
      }}>suscribe</button>
      <button onClick={async () => {
        const channel = handler.client.channels.get('bin-eye-pal');
        channel.publish("example", "message data");
      }}>message</button> */}
    </div>
  )
}
