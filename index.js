const _ = require('lodash')
const B = require('./B')

const gepm = require('./gepm')

const prompt = require('prompt-sync')({ sigint: true })

const next_gen = next_gen_1
const kill_old = kill_old_1
const best_fit = best_fit_1
const shp = shp1

/**
 * Debugging util
 */
function shp1 (pop) {
  return pop.pop.map(i => i.hp)
}



/**
 * Returns an initial config
 *
 * @returns {GepmConfig}
 */
function gepm_config () {
  return {
    age_trust: 0.1,
    death_score: 0,
    initial_pop_size: 30,
    number_of_chromossomes: 3,
    head_length: 15,
    genes_per_chromossome: [20, 20, 9],
    number_of_sensors: 20,
    initial_score: 1,
    max_time: 2 ** 20, // 2018043732966988
    max_score: 10**10,
    max_pop: 30,
    mutation_rate: 0.05,
    tourney_size: 20,
    death_count: 16,
    max_death_count: 25,
    spawn_number: 8,
    death_score_step: 0.016
  }
}

/**
 * Runs the algorithm.
 *
 * @param {Function} fitness
 * @param {GepmConfig} config
 * @returns {Individual}
 */
function run (fitness, config) {
  var pop = initial_pop(config)

  var bfn

  while (not_finished(config, bfn)) {
    // debugger
    pop = update_world(fitness, pop)

    // Mating season. It's based on population numbers
    // so that every individual had a chance to prove itself.
    const pl = pop.pop.length

    pop = kill_old(config, pop)

    if (pop.pop.length !== pl) {
      bfn = best_fit(config, pop)

      // console.log(pop.time, bfn.hp)
      console.log(_.sortBy(pop.pop.map(i => i.hp)).map(n => n.toFixed(2)).join(' '))
      console.log()
    }

    pop = next_gen(config, pop)

    // if (pop.time % 1024 === 0) {
    //   // debugger
    //   console.log(pop.time, bfn.hp)
    // }

    // if (pop.time === 1000) {
    //   debugger
    // }
  }

  return bfn
}

/**
 * Returns a genetic diversity indicator
 *
 * @param {Array} pop
 * @returns {Number}
 */
function gen_div (pop) {
  return Object.keys(_.groupBy(pop, 'id')).length
}

/**
 * Goes through the population and finds the best fit.
 *
 * @param {GepmConfig} config
 * @param {Population} pop
 * @returns {Individual}
 */
function best_fit_1 (config, pop) {
  return pop.pop.reduce((acc, value) => {
    if (acc === undefined) {
      return value
    }

    if (value.hp > acc.hp) {
      return value
    }

    return acc
  })
}

/**
 * Kills individuals
 *
 * @param {GepmConfig} config
 * @param {Population} pop
 * @returns {Population}
 */
function kill_old_1 (config, pop) {
  // const new_pop = _.assign({}, pop, {
  //   pop: pop.pop.filter(is_alive(config))
  // })

  // const diff = pop.pop.length - new_pop.pop.length
  // if (diff === 0) {
  //   config.death_score += config.death_score_step
  // } else {
  //   console.log('Killed ', pop.pop.length - new_pop.pop.length, ' with score ', config.death_score, ' at time ', pop.time)
  //   config.death_score = 0
  // }

  // return new_pop
  if (pop.time % (config.max_pop * 8) === 0) {
    var new_pop = pop.pop
    var death_count = config.death_count

    const gd = gen_div(new_pop)

    console.log(gd)

    if (gd <= 4) {
      death_count = config.max_death_count
    }

    var w = 0
    for (w = 0; w < death_count; w++) {
      var dc = _.sample(new_pop)

      var i
      for (i = 0; i < config.tourney_size; i++) {
        var dcc = _.sample(new_pop)

        if (dcc.hp < dc.hp) {
          dc = dcc
        }
      }

      new_pop = new_pop.filter(i => i !== dc)
    }

    return _.assign({}, pop, { pop: new_pop })
  }

  return pop
}


/**
 * Returns true if the individual should remain alive.
 *
 * @param {GepmConfig} config
 * @param {Individual} ind
 * @returns {Boolean}
 */
function is_alive (config) {
  return function (ind) {
    if (ind.age === 0) {
      return true
    }

    const avg = ind.hp / ind.age
    return (avg > config.death_score)
  }
}


/**
 * Creates the initial population
 *
 * @param {GepmConfig} config
 * @returns {Object}
 */
function initial_pop (config) {
  return {
    time: 0,
    pop: _.range(config.initial_pop_size)
      .map(function () {
        const chromo = gepm.random(config.number_of_chromossomes, config.head_length, config.genes_per_chromossome)

        return individual(config, chromo)
      })
  }
}

/**
 * Creates an individual
 *
 * @param {GepmConfig} config
 * @param {Array} chromo The chromossomes
 * @returns {Individual}
 */
function individual (config, chromo) {
  const terms = _.range(config.number_of_sensors).map(B.bus)
  const pheno = gepm.translate(chromo, terms, config.head_length) // 036181957607076
  // 036181961191109
  return {
    id: _.range(3).map(() => _.sample('abcdefghijklmnopqrstuvwxyz'.split(''))).join(''),
    chromo: chromo,
    terms: terms,
    pheno: pheno,
    hp: config.initial_score,
    enemies: [],
    values: [],
    head_length: config.head_length
  }
}

/**
 * Returns true if the population is not in it's final state
 *
 * @param {GepmConfig} config
 * @param {Individual} bfn
 * @returns {Boolean}
 */
function not_finished (config, bfn) {
  return _.isUndefined(bfn) || (bfn.hp < config.max_score)

  /**
   * Returns true if an individual with the best score is present.
   *
   * @returns {Boolean}
   */
  function bestScore () {
    return pop.pop.filter(i => i.hp >= config.max_score).length > 0
  }
}

/**
 * Updates the population using the given fitness function
 *
 * @param {Function} fitness
 * @param {Population} pop
 */
function update_world (fitness, pop) {
  var new_pop = _.shuffle(pop.pop)
  const p1 = new_pop[0]
  const p2 = new_pop[1]

  new_pop = new_pop.slice(2).concat(fitness(p1, p2))

  return Object.assign({}, pop, {
    time: pop.time + 1,
    pop: new_pop
  })
}


/**
 * Calculates the weighted mean
 *
 * @param {Array} values
 * @param {Array} weights
 * @returns {Number}
 */
function weighted_mean (values, weights) {
  const sv = _.sum(_.zip(values, weights).map(p => p[0] * p[1]))
  const sw = _.sum(weights)

  return sv / (sw || 1)
}


/**
 * Makes an inidividual older
 *
 * @param {Individual}
 * @returns {Individual}
 */
function age (i) {
  return Object.assign({}, i, { age: i.age + 1 })
}


/**
 * Generates the next population
 *
 * @param {GepmConfig} config
 * @param {Population} pop
 * @returns {Population}
 */
function next_gen_1 (config, pop) {
  if (pop.time % (config.max_pop * 8) === 0) {
     if (pop.pop.length >= config.max_pop) {
      return pop
    }

    debugger

    var new_pop = pop.pop.concat(pop.pop.map(function (i) {
      const nind = individual(config, gepm.mutate(i.chromo, config.mutation_rate, config.head_length))

      nind.id = i.id // For tracking

      return nind
    }))

    if (new_pop.length < config.max_pop) {
      const ldiff = config.max_pop - new_pop.length

      new_pop = new_pop.concat(_.range(ldiff).map(() => individual(config, gepm.random(config.number_of_chromossomes, config.head_length, config.genes_per_chromossome))))
    }

    return _.assign({}, pop, { pop: reset_hp(new_pop) })
  }

  return pop
}


/**
 * Resets the hp data of each individual
 *
 * @param {Array}
 * @returns {Array}
 */
function reset_hp (pop) {
  return pop.map(function (i) {
    return _.assign({}, i, {
      enemies: [i.hp],
      values: [i.hp],
      hp: i.hp
    })
  })
}



const P1_WINS = 0
const P2_WINS = 1
const TIE = 3
const ONGOING = 4
const P1_INVALID = 5
const P2_INVALID = 6



/**
 * Play Tic Tac toe to measure the fitness.
 * If a player makes an invalid move, he's punished,
 * but the adversary is not awarded a win. This is meant to
 * prevent population stagnation.
 *
 * @param {Individual} i1
 * @param {Individual} i2
 * @returns {Array}
 */
function tic_tac (i1, i2) {
  var board = new_board()

  var p1 = _.assign({}, i1), p2 = _.assign({}, i2)

  var winner, loser, tie = false

  // If there was not a tie, then there was a loser, for sure.
  // This may not be the case with winners.
  while (loser === undefined && !tie) {
    const move1 = compute_move(board, p1, 1)

    if (move1.length === 0) {
      p1 = one_up(p1, 7)
    } else {
      p1 = one_up(p1, Math.abs(9 - move1.length))
    }

    board = play(board, move1)

    if (board.status === ONGOING) {
      p1 = one_up(p1, 8)
    }

    if (p1.human || p2.human) {
      print_board(board)
    }

    const move2 = compute_move(board, p2, -1)

    if (move2.length === 0) {
      if (board.status !== ONGOING) {
        p2 = one_up(p2, 9)
      } else {
        p2 = one_up(p2, 7)
      }
    } else {
      p2 = one_up(p2, Math.abs(9 - move2.length))
    }

    board = play(board, move2)

    if (board.status === ONGOING) {
      p2 = one_up(p2, 8)
    }

    if (p1.human || p2.human) {
      print_board(board)
    }

    winner = who_won(board, p1, p2)
    loser = who_lost(board, p1, p2)
    tie = is_tied(board)
  }

  if (tie) {
    return [one_up(p1, 20), one_up(p2, 20)]
  }

  if (winner === undefined) {
    return [p1, p2]
  }

  return [one_up(winner, 40), loser]
}



/**
 * Play Tic Tac toe to measure the fitness.
 * If a player makes an invalid move, he's punished,
 * but the adversary is not awarded a win. This is meant to
 * prevent population stagnation.
 *
 * @param {Individual} i1
 * @param {Individual} i2
 * @returns {Array}
 */
function tic_tac2 (i1, i2) {
  var board = new_board()

  const enemies1 = i1.enemies.concat([i2.hp])
  const enemies2 = i2.enemies.concat([i1.hp])

  var p1 = _.assign({}, i1, {
    tmp_score: 0,
    enemies: enemies1
  })

  var p2 = _.assign({}, i2, {
    tmp_score: 0,
    enemies: enemies2
  })

  var winner, loser, tie = false, phase = 0

  // If there was not a tie, then there was a loser, for sure.
  // This may not be the case with winners.
  while (loser === undefined && !tie) {
    const move1 = compute_move(board, p1, 1)

    if (move1.length === 0) {
      p1 = one_up(p1, 7 * (10 ** phase))
    } else {
      p1 = one_up(p1, Math.abs(9 - move1.length) * (10 ** phase))
    }

    board = play(board, move1)

    if (board.status === ONGOING) {
      p1 = one_up(p1, 8 * (10 ** phase))
    }

    if (p1.human || p2.human) {
      print_board(board)
    }

    const move2 = compute_move(board, p2, -1)

    if (move2.length === 0) {
      if (board.status !== ONGOING) {
        p2 = one_up(p2, 9 * (10 ** phase))
      } else {
        p2 = one_up(p2, 7 * (10 ** phase))
      }
    } else {
      p2 = one_up(p2, Math.abs(9 - move2.length) * (10 ** phase))
    }

    board = play(board, move2)

    if (board.status === ONGOING) {
      p2 = one_up(p2, 8 * (10 ** phase))
    }

    if (p1.human || p2.human) {
      print_board(board)
    }

    winner = who_won(board, p1, p2)
    loser = who_lost(board, p1, p2)
    tie = is_tied(board)

    phase += 1
  }

  if (tie) {
    return [calc_hp(one_up(p1, 10 ** 9)), calc_hp(one_up(p2, 10 ** 9))]
  }

  if (winner === undefined) {
    return [calc_hp(p1), calc_hp(p2)]
  }

  return [calc_hp(one_up(winner, 10 ** 10)), calc_hp(loser)]
}


/**
 * Calculates the weighted mean of the matches.
 *
 * @param {Individual} i
 * @returns {Individual}
 */
function calc_hp (i) {
  var scores = i.values.concat([i.tmp_score])

  return _.assign({}, i, {
    values: scores,
    hp: weighted_mean(scores, i.enemies)
  })
}

/**
 * Caps an array at the length
 *
 * @param {Array} a
 * @param {Number} l
 * @returns {Array}
 */
function cap (a, l) {
  return a.length > l ? a.slice(a.length - l) : a
}



/**
 * Prints the board to the console
 *
 * @param {Board} board
 */
function print_board (board) {
  if (board.status === P2_INVALID) {
    return console.log('Player 2 made an invalid move')
  }

  if (board.status === P1_INVALID) {
    return console.log('Player 1 made an invalid move')
  }

  console.log('')
  console.log(board.playfield.slice(0, 3).map(tic_token).join('|'))
  console.log(_.repeat('-', 5))
  console.log(board.playfield.slice(3, 6).map(tic_token).join('|'))
  console.log(_.repeat('-', 5))
  console.log(board.playfield.slice(6, 9).map(tic_token).join('|'))
  console.log('')

  function tic_token (v) {
    if (v === -1) return 'O'
    if (v === 1) return 'X'
    return ' '
  }
}

/**
 * Returns an individual with increased hp.
 *
 * @param {Individual} ind
 * @param {Number | undefined} amt
 * @returns {Individual}
 */
function one_up (ind, amt) {
  return _.assign({}, ind, {
    tmp_score: ind.tmp_score + (amt || 1)
  })
}

/**
 * Returns an individual with decreased hp.
 *
 * @param {Individual} ind
 * @param {Number | undefined} amt
 * @returns {Individual}
 */
function one_down (ind, amt) {
  return _.assign({}, ind, {
    tmp_score: ind.tmp_score - (amt || 1)
  })
}

/**
 * Returns the winner player.
 * Note that if a player committed a fault, the adversary
 * is not awarded a win.
 *
 * @param {Board} board
 * @param {Individual} p1
 * @param {Individual} p2
 * @returns {Individual | undefined}
 */
function who_won (board, p1, p2) {
  if (board.status === P1_WINS) {
    return p1
  }

  if (board.status === P2_WINS) {
    return p2
  }

  return undefined
}

/**
 * Returns the loser player.
 *
 * @param {Board} board
 * @param {Individual} p1
 * @param {Individual} p2
 * @returns {Individual | undefined}
 */
function who_lost (board, p1, p2) {
  if (board.status === P1_WINS || board.status === P2_INVALID) {
    return p2
  }

  if (board.status === P2_WINS || board.status === P1_INVALID) {
    return p1
  }

  return undefined
}

/**
 * Returns true if the game is tied
 *
 * @param {Board} board
 * @returns {Boolean}
 */
function is_tied (board) {
  return board.status === TIE
}


/**
 * Creates a new Tic Tac Toe board
 *
 * @returns {TTBoard}
 */
function new_board () {
  return {
    status: ONGOING,
    playfield: _.range(9).map(() => 0),
    turn: 1
  }
}

/**
 * Computes a move from the individual.
 *
 * @param {TTBoard} board
 * @param {Individual} p
 * @param {Number} turn
 * @returns {Array}
 */
function compute_move (board, p, turn) {
  if (p.human) {
    return [parseInt(prompt('Your move: '))]
  }

  // Bits from board
  const bfb = _.flatten(board.playfield.map(function (s) {
    switch(s) {
      case 0:
        return [false, false]
      case 1:
        return [true, false]
      case -1:
        return [false, true]
    }
  }))

  const values = bfb.concat([board.turn === 1, turn === 1])

  const moves = gepm.compute(p.terms, p.pheno, values)

  return moves.map((v, i) => v ? i : -1).filter(v => v !== -1)
}

/**
 * Makes a play and returns the new board.
 *
 * @param {Board} board
 * @param {Array} moves
 * @returns {Board}
 */
function play (board, moves) {
  if (board.status !== ONGOING) {
    return board
  }

  const move = moves.length === 1 ? moves[0] : -1

  if (move < 0 || board.playfield[move] !== 0) {
    return Object.assign({}, board, {
      status: board.turn === 1 ? P1_INVALID : P2_INVALID
    })
  }

  const new_board = _.assign({}, board)

  new_board.playfield[move] = new_board.turn
  new_board.turn = -new_board.turn

  return check_win(new_board)
}


/**
 * Checks if the game is over.
 *
 * @param {Board} board
 * @returns {Board}
 */
function check_win (board) {
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
    return _.assign({}, board, { status: P1_WINS })
  }

  if (l1 === -3 || l2 === -3 || l3 === -3 || c1 === -3 || c2 === -3 || c3 === -3 || d1 === -3 || d2 === -3) {
    return _.assign({}, board, { status: P2_WINS })
  }

  if (b.filter(s => s === 0).length === 0) {
    return _.assign({}, board, { status: TIE })
  }

  return board
}

const root_config = gepm_config()

const bf = run(tic_tac2, root_config)

// const chromo = gepm.random(config.number_of_chromossomes, config.head_length, config.genes_per_chromossome)

console.log('Best fit, with final score of ', bf.hp, ' and age ', bf.age)

var play_again = true

while (play_again) {
  tic_tac2(bf, { human: true, enemies: [], values: [] })

  play_again = prompt('Play again? ') === 'y'
}
