const dispatch = require('./stjs/dispatcher')
const dspProtocol = require('./stjs/dispatcher.protocol')

const Actor = require('./stjs/actor')

const TicTacBoard = require('./tic-tac/tic-tac-board.actor')
const RandomPlayer = require('./tic-tac/random-player.actor')
const HumanPlayer = require('./tic-tac/human-player.actor')

main()

/**
 * The main function of this application
 */
function main () {
  const board = TicTacBoard(Actor('TestBoard'))
  const randomPlayer = RandomPlayer(Actor('Random'))
  const humanPlayer = HumanPlayer(Actor('Human'))

  dispatch('dispatcher', dspProtocol.newActor(board))
  dispatch('dispatcher', dspProtocol.newActor(randomPlayer))
  dispatch('dispatcher', dspProtocol.newActor(humanPlayer))

  dispatch('TestBoard', { type: 'setPlayerOne', player: 'Human' })
  dispatch('TestBoard', { type: 'setPlayerTwo', player: 'Random' })
  dispatch('TestBoard', { type: 'startGame' })
}