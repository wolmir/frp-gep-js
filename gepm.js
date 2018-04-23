// t = h(n-1) + 1

const B = require('./B')

const NOT = 1
const MEM = 2
const AND = 3
const OR = 4
const TERM = 5

const nucleotides = [0x00, 0x01, 0x02, 0x03, 0x04]

const gepm = {
  translate: translate,
  random: random,
  mutate: mutate,
  compute: compute
}

module.exports = gepm

/**
 * Computes the result of a B net
 *
 * @param {Array} terminals
 * @param {Array} outputs
 * @param {Array} values
 * @returns {Array}
 */
function compute (terminals, outputs, values) {
  const ret = []

  const unsubs = outputs.map(o => o.subscribe(function (v) {
    ret.push(v)
  }))

  values.forEach((v, i) => terminals[i].push(v))

  unsubs.forEach(unsub => unsub())

  return ret
}

/**
 * Returns a mutated set of chromossomes
 *
 * @param {Array} c Chromossomes
 * @param {Number} mr Mutation rate 0 <= mr <= 1
 * @param {Number} hl Head length
 * @returns {Array}
 */
function mutate (c, mr, hl) {
  const cl = c.length
  const mc = []

  var i
  for (i = 0; i < cl; i++) {
    mc[i] = mutate_c(c[i], mr, hl)
  }

  return mc
}

/**
 * Mutates a chromossome
 *
 * @param {Uint8Array} c Chromossome
 * @param {Number} mr Mutation rate
 * @param {Number} hl Head length
 * @returns {Uint8Array}
 */
function mutate_c (c, mr, hl) {
  var mc = []
  const gl = 2*hl + 1
  const ng = c.length / gl

  var cg = 0
  for (cg = 0; cg < ng; cg++) {
    const g = c.slice(gl * cg, gl * (cg + 1))

    mc = mc.concat(mutate_g(g, mr, hl))
  }

  return Uint8Array.from(mc)
}

/**
 * Mutates a single gene
 *
 * @param {Uint8Array} g Gene
 * @param {Number} mr Mutation rate
 * @param {Number} hl Head length
 * @returns {Array}
 */
function mutate_g (g, mr, hl) {
  var mg = []

  var cn = 0
  const gl = g.length

  for (cn = 0; cn < gl; cn++) {
    if (Math.random() < mr) {
      if (cn < hl) {
        mg[cn] = nucleotides[Math.floor(Math.random() * 5)]

        if (mg[cn] === 0x04) {
          mg[cn] = Math.floor(Math.random() * 251) + 4
        }
      } else {
        mg[cn] = Math.floor(Math.random() * 251) + 4
      }
    } else {
      mg[cn] = g[cn]
    }
  }

  return mg
}

/**
 * Generates random chromossomes.
 *
 * @param {Number} nc Number of chromossomes
 * @param {Number} hl Head length
 * @param {Number} gcp Genes per chromossome
 * @returns {Array}
 */
function random (nc, hl, gcp) {
  const c = []

  const gc = nc > 1 ? gcp : [gcp]

  var i
  for (i = 0; i < nc; i++) {
    c.push(Uint8Array.from(random_chromossome(hl, gc[i])))
  }

  return c
}

/**
 * Generates a random chromossome
 *
 * @param {Number} hl Head length
 * @param {Number} gc Genes per chromossome
 * @returns {Array}
 */
function random_chromossome (hl, gc) {
  var genes = []

  var ci
  for (ci = 0; ci < gc; ci++) {
    genes = genes.concat(random_gene(hl))
  }

  return genes
}

/**
 * Creates a random gene
 *
 * @param {Number} hl Head length
 * @returns {Array}
 */
function random_gene (hl) {
  const head = []
  const tail = []

  var w
  for (w = 0; w < hl; w++) {
    head[w] = nucleotides[Math.floor(Math.random() * 5)]

    if (head[w] === 0x04) {
      head[w] = Math.floor(Math.random() * 251) + 4
    }
  }

  const tl = hl + 1
  var z
  for (z = 0; z < tl; z++) {
    tail[z] = Math.floor(Math.random() * 251) + 4
  }

  return head.concat(tail)
}

/**
 * Translates a set of chromossomes to a phenotype.
 * For the these purposes, the phenotype is the set of output terminals.
 * Each output terminal is called a cell.
 * If it's a single cell, then returns the final BitStream.
 * Otherwise, returns an array of cells.
 *
 * @param {Array} chromossomes
 * @param {Array} terminals
 * @param {Number} headLength
 * @returns {Array | BitStream}
 */
function translate (chromossomes, terminals, headLength) {
  var cells = []

  var ci = 0
  var ccl = chromossomes.length

  var terms = terminals

  for (ci = 0; ci < ccl; ci++) {
    terms = terms.concat(cells)

    cells = translate_c(chromossomes[ci], terms, headLength)
  }

  if (cells.length === 1) {
    return cells[0] // For backwards compatibility
  }

  return cells
}

/**
 * Translates a chromossome to an array of phenotypes
 *
 * @param {Uint8Array} chromossome
 * @param {Array} terminals
 * @param {Number} headLength
 * @returns {Array}
 */
function translate_c (chromossome, terminals, headLength) {
  const cells = []

  // head + tail, where tail = head + 1
  const geneLength = (headLength * 2) + 1

  const sg = splice_genes(chromossome, geneLength)

  var i
  var sgl = sg.length

  // For each gene
  for (i = 0; i < sgl; i++) {
    const rnat = to_rna_t(sg[i])

    cells[i] = translate_r(rnat, terminals, terminals.length)
  }

  return cells
}

/**
 * Splices a chromossome into its component genes.
 *
 * @param {Uint8Array} c The chromossome
 * @param {Number} l The gene length
 * @returns {Array}
 */
function splice_genes (c, l) {
  const g = []

  // The number of genes in this chromossome
  const ng = c.length / l
  var w

  for (w = 0; w < ng; w++) {
    const cd = w * l

    g[w] = c.slice(cd, cd + l)
  }

  return g
}

/**
 * Recursively traverses the RNA tree to build the phenotype.
 *
 * @param {Object} node
 * @param {Array} terms
 * @param {Number} tlength
 * @returns {BitStream}
 */
function translate_r (node, terms, tlength) {
  if (node.t === TERM) {
    return terms[(node.id - 4) % tlength]
  }

  if (node.t === NOT) {
    return B.not(translate_r(node.n[0], terms, tlength))
  }

  if (node.t === MEM) {
    return B.mem(translate_r(node.n[0], terms, tlength))
  }

  if (node.t === AND) {
    return B.and(translate_r(node.n[0], terms, tlength), translate_r(node.n[1], terms, tlength))
  }

  return B.or(translate_r(node.n[0], terms, tlength), translate_r(node.n[1], terms, tlength))
}

/**
 * Gets a GEP gene and translates it into a RNA tree.
 *
 * @param {Uint8Array} gene
 * @returns {Object}
 */
function to_rna_t (gene) {
  const lines = rna_build_lines(gene)

  var i = 0
  var l = lines.length - 1
  for (i = 0; i < l; i++) {
    rna_connect_lines(lines[i], lines[i + 1])
  }

  return lines[0][0]
}

/**
 * Builds the expression tree lines from the gene.
 *
 * @param {Uint8Array} gene
 * @returns {Array}
 */
function rna_build_lines (gene) {
  const lines = []

  var nll = 1 // Next line length
  var i = 0 // Current index in the gene
  const gl = gene.length

  while ((i < gl) && (nll !== 0)) {
    const dna_line = gene.slice(i, i + nll)

    var nnll = 0
    var rna_line = []
    var j
    var l = dna_line.length

    for (j = 0; j < l; j++) {
      const c = dna_line[j]

      switch (c) {
        case 0x00:
          rna_line[j] = rna_node(NOT)
          nnll += 1
          break

        case 0x01:
          rna_line[j] = rna_node(MEM)
          nnll += 1
          break

        case 0x02:
          rna_line[j] = rna_node(AND)
          nnll += 2
          break

        case 0x03:
          rna_line[j] = rna_node(OR)
          nnll += 2
          break

        default:
          rna_line[j] = rna_node(TERM, c)
      }
    }

    lines.push(rna_line)

    i += nll
    nll = nnll
  }

  return lines
}

/**
 * Creates an RNA node of the specified type.
 *
 * @param {Number} type
 * @param {UInt8} id
 * @returns {Object}
 */
function rna_node (type, id) {
  return {
    t: type,
    id: id,
    n: new Array(2)
  }
}

/**
 * Connects the rna lines according to their arity.
 *
 * @param {Array} line1
 * @param {Array} line2
 */
function rna_connect_lines (line1, line2) {
  var i
  var l1 = line1.length
  var ni = 0 // Current index at line2

  for (i = 0; i < l1; i++) {
    const node = line1[i]

    if (node.t < AND) {
      node.n[0] = line2[ni]

      ni += 1
    } else if (node.t < TERM) {
      node.n[0] = line2[ni]
      node.n[1] = line2[ni + 1]

      ni += 2
    }
  }
}