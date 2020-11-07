import Head from 'next/head'
import React, { useState } from 'react';
import Chess, {getDefaultLineup} from '../src/react-chess'

interface Props {}
interface State {
  pieces: string[]
}

function Demo() {
    const [state, setState] = useState<State>({pieces: getDefaultLineup()})

    const handleMovePiece = (piece, fromSquare, toSquare) => {
      const newPieces = state.pieces
        .map((curr, index) => {
          if (piece.index === index) {
            return `${piece.name}@${toSquare}`
          } else if (curr.indexOf(toSquare) === 2) {
            return false // To be removed from the board
          }
          return curr
        })
        .filter(Boolean)
  
      setState({pieces: newPieces as string[]})
    }
  
    return (
      <div className="demo" style={{width: 600}}>
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
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
        <title>ajedrez</title>
      </Head>

      <Demo />
    </div>
  )
}
