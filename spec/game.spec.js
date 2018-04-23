const Bacon = require('baconjs')
const _ = require('lodash')

const createGame = require('../tic-tac')

describe('TicTacGame', function () {
  it('should exist', function () {
    expect(createGame(Bacon.never(), Bacon.never(), Bacon.never())).toBeDefined()
  })

  it('should accept two player streams', function () {
    expect(function () { createGame() }).toThrow();

    expect(function () { createGame(Bacon.never()) }).toThrow();
  })

  it('should return a game view stream', function () {
    const gameView = createGame(Bacon.never(), Bacon.never(), Bacon.never()).view$

    expect(_.isObject(gameView)).toBe(true)

    expect(typeof gameView.onValue).toBe('function')
  })

  it('should return an error stream', function () {
    const error$ = createGame(Bacon.never(), Bacon.never(), Bacon.never()).error$

    expect(_.isObject(error$)).toBe(true)

    expect(typeof error$.onValue).toBe('function')
  })

  describe('gameView$', function () {
    it('should return the correct initial state when the game begins', function (done) {
      const gameView$ = createGame(Bacon.never(), Bacon.never(), Bacon.never()).view$

      gameView$.onValue(function (view) {
        expect(view.status).toBe('INIT')
        expect(view.turn).toBe(1)
        expect(view.board).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0])
        expect(view.moves).toBe(0)

        done()
      })
    })

    it('should correctly reflect the board state after moves', function (done) {
      const kickoff = new Bacon.Bus()
      const player1 = new Bacon.Bus()
      const player2 = new Bacon.Bus()

      const gameView$ = createGame(player1, player2, kickoff).view$

      gameView$.subscribe(function (event) {
        const view = event.value

        if (_.isObject(view) && view.moves === 2) {
          expect(view.board).toEqual([0, 0, 1, 0, 0, -1, 0, 0, 0])

          expect(view.turn).toBe(1)

          done()
        }
      })

      kickoff.push(1)
      player1.push(2)
      player2.push(5)
    })

    it('should change status to P1_WINS if the player 1 wins the game', function (done) {
      const player1 = new Bacon.Bus()
      const player2 = new Bacon.Bus()
      const kickOff = new Bacon.Bus()

      const game = createGame(player1, player2, kickOff)

      const p1m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [0, 6, 8, 4], 1)
        .subscribe(function (event) {
          player1.push(event.value)
        })

      const p2m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [2, 3, 7], -1)
        .subscribe(function (event) {
          player2.push(event.value)
        })

      game.view$.subscribe(function (view) {
        if (view.value.moves === 7) {
          expect(view.value.status).toBe('P1_WINS')

          done()
        }
      })

      kickOff.push(1)
    })

    it('should change status to P2_WINS if the player 2 wins the game', function (done) {
      const player1 = new Bacon.Bus()
      const player2 = new Bacon.Bus()
      const kickOff = new Bacon.Bus()

      const game = createGame(player1, player2, kickOff)

      const p1m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [0, 1, 4], 1)
        .subscribe(function (event) {
          player1.push(event.value)
        })

      const p2m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [6, 7, 8], -1)
        .subscribe(function (event) {
          player2.push(event.value)
        })

      game.view$.subscribe(function (view) {
        if (view.value.moves === 6) {
          expect(view.value.status).toBe('P2_WINS')

          done()
        }
      })

      kickOff.push(1)
    })

    it('should change status to TIE if no one wins', function (done) {
      const player1 = new Bacon.Bus()
      const player2 = new Bacon.Bus()
      const kickOff = new Bacon.Bus()

      const game = createGame(player1, player2, kickOff)

      const p1m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [0, 2, 7, 3, 8], 1)
        .subscribe(function (event) {
          player1.push(event.value)
        })

      const p2m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [4, 1, 5, 6], -1)
        .subscribe(function (event) {
          player2.push(event.value)
        })

      game.view$.subscribe(function (view) {
        if (view.value.moves === 9) {
          expect(view.value.status).toBe('TIE')

          done()
        }
      })

      kickOff.push(1)
    })

    it('should change status to P1_PUNISH if player 1 makes illegal move', function (done) {
      const player1 = new Bacon.Bus()
      const player2 = new Bacon.Bus()
      const kickOff = new Bacon.Bus()

      const game = createGame(player1, player2, kickOff)

      const p1m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [0, 1], 1)
        .subscribe(function (event) {
          player1.push(event.value)
        })

      const p2m$ = withMoves(game.view$.filter(v => v.status === 'BEGIN'), [1], -1)
        .subscribe(function (event) {
          player2.push(event.value)
        })

      game.view$.subscribe(function (view) {
        if (view.value.moves === 3) {
          expect(view.value.status).toBe('P1_PUNISH')

          done()
        }
      })

      kickOff.push(1)
    })
  })
})

/**
 * Helper function to create a stream from an array of moves.
 *
 * @param {Stream} source$
 * @param {Array} moves
 * @param {Number} turn
 * @returns {Stream}
 */
function withMoves(source$, moves, turn) {
  return source$
    .filter(view => view.turn === turn)
    .scan({
      moves: moves,
      next: -1
    }, function (acc) {
      return _.assign({}, acc, {
        next: acc.next + 1
      })
    })
    // .doLog(turn)
    .filter(acc => acc.next >= 0)
    .map(acc => acc.moves[acc.next])
}