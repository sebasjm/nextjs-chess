import Head from 'next/head'
import React from 'react';
import Chess, {getDefaultLineup} from '../src/react-chess'

interface Props {}
interface State {
  pieces: string[]
}

class Demo extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {pieces: getDefaultLineup()}
    this.handleMovePiece = this.handleMovePiece.bind(this)
  }

  handleMovePiece(piece, fromSquare, toSquare) {
    const newPieces = this.state.pieces
      .map((curr, index) => {
        if (piece.index === index) {
          return `${piece.name}@${toSquare}`
        } else if (curr.indexOf(toSquare) === 2) {
          return false // To be removed from the board
        }
        return curr
      })
      .filter(Boolean)

    this.setState({pieces: newPieces as string[]})
  }

  render() {
    const {pieces} = this.state
    return (
      <div className="demo" style={{width: 600}}>
        <Chess pieces={pieces} onMovePiece={this.handleMovePiece} />
      </div>
    )
  }
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
