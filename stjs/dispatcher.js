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
 * Dispatcher handles message routing between actors. It can also
 * receive messages to add, replace or delete actors.
 * This module exports the {@link dispatch} function, an imperative
 * command to dispatch messages. Use this only on controlled, isolated
 * code blocks, since it's an impure function.
 *
 * @module stjs/dispatcher
 */
'use strict'

/**
 * The value returned from a message
 * @typedef {Object} Bundle
 * @property {Actor} self - The actor itself
 * @property {Array} messages - The messages to be sent
 */

// Instance holder
var manager

// Create instance
if (!manager) {
  manager = {
    things: {}
  }
}

/**
 * Dispatch a message to the specified author.
 *
 * @param {String} receiver - The id of the receiver.
 * @param {Object} msg - The message to dispatch
 * @param {String} msg.to - The intended receiver
 * @param {String} msg.from - The sender
 * @param {String} msg.type - The msg identifier
 */
function dispatch (receiver, msg) {
  if (receiver === 'dispatcher') {
    return handleMessage(msg)
  }

  if (manager.things[receiver]) {
    const thing = manager.things[receiver]

    if (thing.listeners[msg.type]) {
      const bundle = thing.listeners[msg.type](thing, msg)

      manager.things[receiver] = bundle.self

      bundle.messages.forEach(function (message) {
        dispatch(message.to, message)
      })
    } else {
      throw new Error('Listener not found: ' + receiver + ' :: ' + msg.type)
    }
  } else {
    throw new Error('Receiver ' + receiver + ' not found')
  }
}

/**
 * Handles a message destined to the dispatcher itself.
 *
 * @param {Object} msg
 * @param {String} msg.to - The id must be 'dispatcher'
 * @param {String} msg.type - Must be 'newThing', 'replaceThing' or 'removeThing'
 */
function handleMessage (msg) {
  if (msg.type === 'newThing') {
    if (!msg.thing) {
      throw new Error('The thing must be a valid object')
    }

    if (!msg.thing.id) {
      throw new Error('The thing must have an id')
    }

    if (manager.things[msg.thing.id]) {
      throw new Error('Thing ' + msg.thing.id + ' already exists!')
    }

    manager.things[msg.thing.id] = msg.thing
  } else if (msg.type === 'replaceThing') {
    if (!msg.thing) {
      throw new Error('The thing must be a valid object')
    }

    if (!msg.thing.id) {
      throw new Error('The thing must have an id')
    }

    manager.things[msg.thing.id] = msg.thing
  } else if (msg.type === 'removeThing') {
    if (!msg.thingId) {
      throw new Error('It must be a valid Id')
    }

    delete manager.things[msg.thingId]
  }
}

module.exports = dispatch
