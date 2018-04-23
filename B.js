const B = {
  and: (x, y) => BitStream2((a, b) => a && b, x, y),
  or: (x, y) => BitStream2((a, b) => a || b, x, y),
  not: x => BitStream1(x, false, a => !a),
  mem: x => BitStream1(x, true, a => a),
  bus: () => BitStream1()
}

/**
 * Creates a BitStream with two sources.
 *
 * @param {Function} op
 * @param {BitStream} a
 * @param {BitStream} b
 * @returns {BitStream}
 */
function BitStream2 (op, a, b) {
  var listeners = []

  var av
  var bv

  a.subscribe(function (value) {
    av = value

    if (bv !== undefined) {
      push(op(av, bv))
    }
  })

  b.subscribe(function (value) {
    bv = value

    if (av !== undefined) {
      push(op(av, bv))
    }
  })

  return {
    isMem: false,
    subscribe: subscribe,
    unsubscribe: unsubscribe
  }

  function push (value) {
    listeners.forEach(listen => listen(value))

    if (!a.isMem) {
      av = undefined
    }

    if (!b.isMem) {
      bv = undefined
    }
  }

  function subscribe (listener) {
    listeners.push(listener)

    return function () {
      listeners = listeners.filter(l => l !== listener)
    }
  }

  function unsubscribe (listener) {
    listener.remove(listener)
  }
}

/**
 * Creates a BitStream with one source.
 *
 * @param {BitStream} a
 * @param {Boolean} isMem
 * @param {Function} op
 * @returns {BitStream}
 */
function BitStream1 (a, isMem, op) {
  var listeners = []

  var av

  if (typeof a !== 'undefined') {
    a.subscribe(function (value) {
      av = value

      ipush(op(value))
    })
  }

  return {
    isMem: isMem || false,
    subscribe: subscribe,
    push: ipush
  }

  function ipush (value) {
    listeners.forEach(listen => listen(value))
  }

  function subscribe (listener) {
    listeners.push(listener)

    return function () {
      listeners = listeners.filter(l => l !== listener)
    }
  }
}


module.exports = B