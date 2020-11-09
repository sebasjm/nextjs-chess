import Head from 'next/head'
import React, { useEffect, useReducer, useState } from 'react';
import Chess, { getDefaultLineup } from '../src/react-chess'
import * as Ably from 'ably'
import axios from 'axios';

interface Props { }
interface State {
  pieces: string[]
}
interface MovePiece {
  type: 'move';
  data: {
    piece: {
      name: string, index: number;
    },
    to: string
  };
}

type Action = MovePiece;

const handler = { client: null }

const updateState = (state: State, action: Action):State => {
  switch (action.type) {
    case 'move':
      const {piece, to} = action.data
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
      return { pieces: newPieces };
    default:
      throw new Error();
  }
}

const resetState = ():State => ({
  pieces: getDefaultLineup(),
})

function Demo() {
  const [state, dispatch] = useReducer(updateState, undefined, resetState)

  const handleMovePiece = (piece, from, to) => {
    dispatch({type: "move", data: {piece, to}})
  }

  return (
    <div className="demo" style={{ width: 600 }}>
      <Chess pieces={state.pieces} onMovePiece={handleMovePiece} />
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
