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
 * Defines the tic tac player actor
 *
 * @module tic-tac-board.actor
 */

 const _ = require('lodash')

module.exports = TicTacPlayerActor

/**
 * Tic Tac Player actor
 * This is meant to be extended. It will not make any plays.
 *
 * @param {Actor} actor - The source actor
 * @returns {TicTacPlayerActor}
 */
function TicTacPlayerActor (actor) {
  const obj = _.assign({}, actor)

  obj.data.TicTacPlayerActor = {}

  obj.listeners = _.assign({}, obj.listeners, {
    startGame: startGame,
    makePlay: makePlay
  })

  return obj
}

/**
 * Saves the board id and notifies itself to make a play.
 *
 * @param {TicTacPlayerActor} actor
 * @param {{ board: String }} msg
 * @return {Bundle}
 */
function startGame (actor, msg) {
  const bundle = {
    self: _.assign({}, actor),
    messages: []
  }

  bundle.self.data.TicTacPlayerActor = _.assign({}, self.data.TicTacPlayerActor, {
    board: msg.board
  })

  bundle.messages = [{
    to: actor.id,
    type: 'makePlay',
    field: (new Array(9)).fill(0)
  }]

  return bundle
}

/**
 * Calculates and emits the next move
 *
 * @param {TicTacPlayerActor} actor
 * @param {{ field: Array }} msg
 * @returns {Bundle}
 */
function makePlay (actor, msg) {
  const bundle = {
    self: _.assign({}, actor),
    messages: []
  }

  return bundle
}
