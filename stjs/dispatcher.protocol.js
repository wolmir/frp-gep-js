/**
 * Messages for dispatcher.
 *
 * @module stjs/dispatcher.protocol
 */

module.exports = {
  newActor: newActor,
  replaceActor: replaceActor,
  removeActor: removeActor
}

/**
 * Returns a message to include a new actor.
 *
 * @param {Actor} actor
 * @returns {Message}
 */
function newActor (actor) {
  return {
    type: 'newThing',
    thing: actor
  }
}

/**
 * Returns a message to replace an actor.
 *
 * @param {Actor} actor
 * @returns {Message}
 */
function replaceActor (actor) {
  return {
    type: 'replaceThing',
    thing: actor
  }
}

/**
 * Returns a message to delete an actor.
 *
 * @param {Actor} actor
 * @returns {Message}
 */
function removeActor (actor) {
  return {
    type: 'removeThing',
    thing: actor
  }
}
