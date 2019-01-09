/*
  Copyright (C) 2018 Wolmir Nemitz <wolmir.nemitz@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Defines the tic tac actor
 *
 * @module tic-tac-board.actor
 */

 const _ = require('lodash')

const TicTacBoard = require('./tic-tac-board.class')

module.exports = TicTacBoardActor

/**
 * Tic Tac Board actor
 *
 * @param {Actor} actor - The source actor
 * @returns {TicTacBoardActor}
 */
function TicTacBoardActor (actor) {
  const obj = _.assign({}, actor)

  obj.data.TicTacBoardActor = {
    board: TicTacBoard()
  }

  obj.listeners = _.assign({}, obj.listeners, {
    setPlayerOne: setPlayer('One'),
    setPlayerTwo: setPlayer('Two'),
    startGame: startGame,
    play: play
  })

  return obj
}

/**
 * Sets the player one
 *
 * @param {String} which - Which player to set
 * @param {TicTacBoardActor} actor
 * @param {{ type: String, player: String }} msg
 * @returns {Bundle}
 */
function setPlayer (which) {
  return function (actor, msg) {
    const bundle = {
      self: _.assign({}, actor),
      messages: []
    }

    bundle.self.data.TicTacBoardActor['player' + which] = msg.player

    return bundle
  }
}

/**
 * Starts the game by clearing the board and notifying the first player.
 *
 * @param {TicTacBoardActor} actor
 * @param {Message} msg
 * @returns {Bundle}
 */
function startGame (actor, msg) {
  const bundle = {
    self: _.assign({}, actor),
    messages: []
  }

  bundle.self.data.TicTacBoardActor.board = TicTacBoard()

  const notifyPlayerOne = {
    to: actor.data.TicTacBoardActor.playerOne,
    type: 'startGame',
    board: actor.id
  }

  bundle.messages = [notifyPlayerOne]

  return bundle
}

/**
 * Plays the board.
 *
 * @param {TicTacBoardActor} actor
 * @param {{ type: String, move: Number }} msg
 * @returns {Bundle}
 */
function play (actor, msg) {
  const bundle = {
    self: _.assign({}, actor),
    messages: []
  }

  const board = actor.data.TicTacBoardActor.board.play(msg.move)

  bundle.self.data.TicTacBoardActor.board = board

  const status = board.getStatus()

  if (status !== TicTacBoard.ONGOING) {
    if (status === TicTacBoard.P1_INVALID || status === TicTacBoard.P2_WINS) {
      bundle.messages = [
        {
          to: actor.data.TicTacBoardActor.playerTwo,
          type: 'win'
        },
        {
          to: actor.data.TicTacBoardActor.playerOne,
          type: 'lose'
        }
      ]
    } else if (status === TicTacBoard.P2_INVALID || status === TicTacBoard.P1_WINS) {
      bundle.messages = [
        {
          to: actor.data.TicTacBoardActor.playerTwo,
          type: 'lose'
        },
        {
          to: actor.data.TicTacBoardActor.playerOne,
          type: 'win'
        }
      ]
    } else {
      bundle.messages = [
        {
          to: actor.data.TicTacBoardActor.playerTwo,
          type: 'tie'
        },
        {
          to: actor.data.TicTacBoardActor.playerOne,
          type: 'tie'
        }
      ]
    }
  } else {
    const player = board.turn === 1 ? 'playerOne' : 'playerTwo'

    bundle.messages = [
      {
        to: actor.data.TicTacBoardActor[player],
        type: 'makePlay',
        field: board.getField()
      }
    ]
  }

  return bundle
}
