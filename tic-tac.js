const Bacon = require('baconjs')
const _ = require('lodash')

function createGame (player1, player2, kickOff) {
  if (!_.isObject(player1) || !_.isObject(player2)) {
    throw new Error('Two player streams are required')
  }

  const initialState = {
    turn: 1,
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    moves: 0,
    status: 'INIT'
  }

  const player1Move$ = player1
    .map(move => [move, 1])

  const player2Move$ = player2
    .map(move => [move, -1])

  const move$ = player1Move$.merge(player2Move$)

  const status$ = kickOff.scan('INIT', () => 'BEGIN').map(s => _.set({}, 'status', s)).changes()

  const view$ = move$
    .filter(move => (move[0] >= 0) && (move[0] <= 8))
    .map(m => _.set({}, 'move', m))
    .merge(status$)
    .scan(initialState, updateState)
    .map(checkStatus)

  const error$ = move$
    .filter(move => (move[0] < 0) || (move[0] > 8))
    .map(() => 'Illegal move')

  return {
    view$: view$,
    error$: error$
  }
}

/**
 * Updates the state based on either a move or a status update
 *
 * @param {Object} view
 * @param {Object} event
 * @returns {Object}
 */
function updateState (view, event) {
  if (event.status) {
    return _.assign({}, view, event)
  }

  if ((view.turn === event.move[1]) && (view.status === 'BEGIN')) {
    if (view.board[event.move[0]] !== 0) {
      const status = (event.move[1] > 0) ? 'P1_PUNISH' : 'P2_PUNISH'

      return _.assign({}, view, {
        status: status,
        moves: view.moves + 1
      })
    }

    return _.assign({}, view, {
      board: setArray(view.board, event.move[0], event.move[1]),
      moves: view.moves + 1,
      turn: -event.move[1]
    })
  }

  return view
}

/**
 * Creates a copy of the source array, with the specified position
 * changed to the specified value.
 *
 * @param {Array} array
 * @param {Number} pos
 * @param {*} value
 * @returns {Array}
 */
function setArray(array, pos, value) {
  return _.range(array.length)
    .map(function (v, i) {
      if (i === pos) {
        return value
      }

      return array[i]
    })
}

/**
 * Check for a win status
 *
 * @param {Object} state
 * @returns {Object}
 */
function checkStatus (state) {
  if (state.status !== 'BEGIN') {
    return state
  }

  const board = state.board

  const sums = []

  sums.push(board[0] + board[1] + board[2])
  sums.push(board[3] + board[4] + board[5])
  sums.push(board[6] + board[7] + board[8])

  sums.push(board[0] + board[3] + board[6])
  sums.push(board[1] + board[4] + board[7])
  sums.push(board[2] + board[5] + board[8])

  sums.push(board[0] + board[4] + board[8])
  sums.push(board[2] + board[4] + board[6])

  if (sums.find(s => s === 3)) {
    return _.assign({}, state, {
      status: 'P1_WINS'
    })
  }

  if (sums.find(s => s === -3)) {
    return _.assign({}, state, {
      status: 'P2_WINS'
    })
  }

  if (board.filter(p => p === 0).length === 0) {
    return _.assign({}, state, {
      status: 'TIE'
    })
  }

  return state
}

module.exports = createGame