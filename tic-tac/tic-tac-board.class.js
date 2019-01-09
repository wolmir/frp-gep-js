/**
 * Defines the tic tac toe class.
 *
 * @module tic-tac-board.class
 */

const Classe = require('pyoo.js')

const TicTacBoard = Classe({
  /**
   * Status constants
   */
  ONGOING: 0,
  P1_INVALID: 1,
  P2_INVALID: 2,
  P1_WINS: 3,
  P2_WINS: 4,
  TIE: 5,

  /**
   * Class body
   */
  __init__: __init__,
  play: play,
  copy: copy,
  checkWin: checkWin,
  getStatus: (self) => self.status,
  getField: (self) => self.field
})

/**
 * Creates a new board
 *
 * @param {Board} self - The board instance
 * @returns {Board}
 */
function __init__ (self) {
  self.field = (new Array(9)).fill(0)
  self.status = TicTacBoard.ONGOING
  self.turn = 1
}

/**
 * Makes a move and returns the new Board.
 * The move param must be an integer between 0 and 8,
 * which represents the square to be played on.
 * If the move is outside of this range, the player who made
 * it will loose and the status will reflect this only if
 * the previous status was ONGOING. Otherwise the same board
 * is returned.
 *
 * @param {Board} self - The board instance
 * @param {Number} move - Number between 0 and 8
 * @returns {Board} The new board
 */
function play (self, move) {
  const board = self.copy()

  if (board.status !== TicTacBoard.ONGOING) {
    return board
  }

  if (move < 0 || move > 8 || board.field[move] !== 0) {
    board.status = (board.turn === 1 ? TicTacBoard.P1_INVALID : TicTacBoard.P2_INVALID)

    return board
  }

  board.field = setValue(board.field, move, board.turn)
  board.turn = -board.turn

  return board.checkWin()
}

/**
 * Checks if the game is over.
 *
 * @param {Board} self - The board instance
 * @returns {Board}
 */
function checkWin (self) {
  const board = self.copy()

  const b = board.playfield

  const l1 = b[0] + b[1] + b[2]
  const l2 = b[3] + b[4] + b[5]
  const l3 = b[6] + b[7] + b[8]

  const c1 = b[0] + b[3] + b[6]
  const c2 = b[1] + b[4] + b[7]
  const c3 = b[2] + b[5] + b[8]

  const d1 = b[0] + b[4] + b[8]
  const d2 = b[2] + b[4] + b[6]

  if (l1 === 3 || l2 === 3 || l3 === 3 || c1 === 3 || c2 === 3 || c3 === 3 || d1 === 3 || d2 === 3) {
    board.status = TicTacBoard.P1_WINS
  } else if (l1 === -3 || l2 === -3 || l3 === -3 || c1 === -3 || c2 === -3 || c3 === -3 || d1 === -3 || d2 === -3) {
    board.status = TicTacBoard.P2_WINS
  } else if (b.filter(s => s === 0).length === 0) {
    board.status = TicTacBoard.TIE
  }

  return board
}

/**
 * Makes a copy of the board.
 *
 * @param {Board} self - The board instance
 * @returns {Board}
 */
function copy (self) {
  const board = TicTacBoard()

  board.field = self.field.map(i => i)
  board.status = self.status
  board.turn = self.turn

  return board
}

/**
 * Creates a new array with the specified index set to that value.
 *
 * @param {Array} array - The source array
 * @param {Number} index - The index
 * @param {*} value
 * @returns {Array}
 */
function setValue (array, index, value) {
  const newArray = array.map(i => i)

  newArray[index] = value

  return newArray
}
