const gepm = require('../gepm')
const B = require('../B')

describe('gepm.translate', function () {
  it('should exist', function () {
    expect(typeof gepm.translate).toBe('function')
  })

  describe('Single chromossomes', function () {
    describe('Single gene', function () {
      it('should work for a single terminal', function (done) {
        const gene = new Uint8Array(new ArrayBuffer(1))

        gene[0] = 0x05 // The first terminal after the operators

        const chromossomes = [gene]
        const terminals = [B.bus()]
        const headLength = 1

        const individual = gepm.translate(chromossomes, terminals, headLength)

        individual.subscribe(function (value) {
          expect(value).toBe(true)

          done()
        })

        terminals[0].push(true)
      })

      it('should work for multiple terminals using modulus', function (done) {
        const gene = new Uint8Array(new ArrayBuffer(1))

        gene[0] = 0x0a

        const chromossomes = [gene]
        const terminals = [B.bus(), B.bus(), B.bus()]
        const headLength = 1

        const individual = gepm.translate(chromossomes, terminals, headLength)

        individual.subscribe(function (value) {
          expect(value).toBe(true)
          done()
        })

        terminals[0].push(true)
      })

      it('should work with a not operator', function (done) {
        const gene = new Uint8Array(new ArrayBuffer(3))

        gene[0] = 0x00
        gene[1] = 0x0a
        gene[2] = 0xfb

        const chromossomes = [gene]
        const terminals = [B.bus()]
        const headLength = 1

        const individual = gepm.translate(chromossomes, terminals, headLength)

        individual.subscribe(function (value) {
          expect(value).toBe(false)
          done()
        })

        terminals[0].push(true)
      })

      it('should work with a mem operator', function (done) {
        const gene = new Uint8Array(new ArrayBuffer(3))

        gene[0] = 0x01
        gene[1] = 0x0a
        gene[2] = 0xfb

        const chromossomes = [gene]
        const terminals = [B.bus()]
        const headLength = 1

        const individual = gepm.translate(chromossomes, terminals, headLength)

        individual.subscribe(function (value) {
          expect(value).toBe(true)
          done()
        })

        terminals[0].push(true)
      })

      it('should work with an and operator', function (done) {
        const gene = new Uint8Array(new ArrayBuffer(3))

        gene[0] = 0x02
        gene[1] = 0x04
        gene[2] = 0x05

        const chromossomes = [gene]
        const terminals = [B.bus(), B.bus()]
        const headLength = 1

        const individual = gepm.translate(chromossomes, terminals, headLength)

        const values = []

        individual.subscribe(function (value) {
          values.push(value)

          if (values.length === 4) {
            expect(values).toEqual([false, false, false, true])
            done()
          }
        })

        terminals[0].push(false)
        terminals[1].push(false)

        terminals[0].push(false)
        terminals[1].push(true)

        terminals[0].push(true)
        terminals[1].push(false)

        terminals[0].push(true)
        terminals[1].push(true)
      })

      it('should work with an or operator', function (done) {
        const gene = new Uint8Array(new ArrayBuffer(3))

        gene[0] = 0x03
        gene[1] = 0x04
        gene[2] = 0x05

        const chromossomes = [gene]
        const terminals = [B.bus(), B.bus()]
        const headLength = 1

        const individual = gepm.translate(chromossomes, terminals, headLength)

        const values = []

        individual.subscribe(function (value) {
          values.push(value)

          if (values.length === 4) {
            expect(values).toEqual([false, true, true, true])
            done()
          }
        })

        terminals[0].push(false)
        terminals[1].push(false)

        terminals[0].push(false)
        terminals[1].push(true)

        terminals[0].push(true)
        terminals[1].push(false)

        terminals[0].push(true)
        terminals[1].push(true)
      })

      it('should work with an arbitrary tree', function (done) {
        const gene = Uint8Array.from([0x03, 0x02, 0x06, 0x01, 0x05, 0x04, 0x07, 0x0a, 0x0c])

        const chromossomes = [gene]
        const terminals = [B.bus(), B.bus(), B.bus()]
        const headLength = 4

        const individual = gepm.translate(chromossomes, terminals, headLength)

        const values = []

        individual.subscribe(function (value) {
          values.push(value)

          if (values.length === 2) {
            expect(values).toEqual([false, true])
            done()
          }
        })

        terminals[0].push(false)
        terminals[1].push(false)
        terminals[2].push(false)

        terminals[0].push(false)
        terminals[1].push(false)
        terminals[2].push(true)
      })
    })

    describe('Multiple genes', function () {
      it('should return an array of bit streams, that represent each cell', function (done) {
        // An and gate and an or gate that share both terminals
        const gene = Uint8Array.from([0x02, 0x04, 0x05, 0x03, 0x04, 0x05])

        const chromossomes = [gene]
        const terminals = [B.bus(), B.bus()]
        const headLength = 1

        const cells = gepm.translate(chromossomes, terminals, headLength)

        const andValues = []
        const orValues = []

        cells[0].subscribe(function (value) {
          andValues.push(value)
        })

        cells[1].subscribe(function (value) {
          orValues.push(value)

          if (orValues.length === 4) {
            expect(andValues).toEqual([false, false, false, true])

            expect(orValues).toEqual([false, true, true, true])

            done()
          }
        })

        terminals[0].push(false)
        terminals[1].push(false)

        terminals[0].push(false)
        terminals[1].push(true)

        terminals[0].push(true)
        terminals[1].push(false)

        terminals[0].push(true)
        terminals[1].push(true)
      })
    })
  })

  describe('Multiple chromossomes', function () {
    // The questions is whether or not I should include the original terminals when
    // translating the remaining chromossomes. I think I will for now.
    // We'll see where this goes...
    it('should use the cells from the previous chromossome as terminals', function (done) {
      const c1 = Uint8Array.from([0x02, 0x04, 0x05, 0x03, 0x04, 0x05])
      const c2 = Uint8Array.from([0x00, 0x06, 0xfb, 0x00, 0x07, 0xda])

      const chromossomes = [c1, c2]
        const terminals = [B.bus(), B.bus()]
        const headLength = 1

        const cells = gepm.translate(chromossomes, terminals, headLength)

        const t1Values = []
        const t2Values = []

        cells[0].subscribe(function (value) {
          t1Values.push(value)
        })

        cells[1].subscribe(function (value) {
          t2Values.push(value)

          if (t2Values.length === 4) {
            expect(t1Values).toEqual([true, true, true, false])

            expect(t2Values).toEqual([true, false, false, false])

            done()
          }
        })

        terminals[0].push(false)
        terminals[1].push(false)

        terminals[0].push(false)
        terminals[1].push(true)

        terminals[0].push(true)
        terminals[1].push(false)

        terminals[0].push(true)
        terminals[1].push(true)
    })
  })
})

describe('gepm.random', function () {
  it('should return valid genes for a single chromossome', function (done) {
    const number_of_chromossomes = 1
    const head_length = 1
    const genes_per_chromossome = 10

    const chromossomes = gepm.random(number_of_chromossomes, head_length, genes_per_chromossome)

    expect(chromossomes.length).toBe(1)

    expect(chromossomes[0].length).toBe(30)

    const terminals = [B.bus()]

    const individuals = gepm.translate(chromossomes, terminals, head_length)

    const values = []

    individuals.forEach(function (i) {
      i.subscribe(function (value) {
        values.push(value)

        if (values.length === 20) {
          done()
        }
      })
    })

    terminals[0].push(true)
    terminals[0].push(false)
  })

  it('should return valid genes for multiple chromossomes', function (done) {
    const number_of_chromossomes = 5
    const head_length = 6
    const genes_per_chromossome = [20, 15, 10, 7, 5]

    const chromossomes = gepm.random(number_of_chromossomes, head_length, genes_per_chromossome)

    expect(chromossomes.length).toBe(5)

    expect(chromossomes[0].length).toBe(260)
    expect(chromossomes[1].length).toBe(195)
    expect(chromossomes[2].length).toBe(130)
    expect(chromossomes[3].length).toBe(91)
    expect(chromossomes[4].length).toBe(65)

    const terminals = [B.bus()]

    const individuals = gepm.translate(chromossomes, terminals, head_length)

    const values = []

    individuals.forEach(function (i) {
      i.subscribe(function (value) {
        values.push(value)

        if (values.length === 10) {
          done()
        }
      })
    })

    terminals[0].push(false)
    terminals[0].push(true)
  })
})

describe('gepm.mutate()', function () {
  it('should return a valid gene for a single gene chromossome', function () {
    const chromossomes = [0.1, 0.5, 0.7].map(r => gepm.mutate(gepm.random(1, 1, 1), r, 1))

    const terminals = [B.bus(), B.bus()]

    expect(() => chromossomes.map(c => gepm.translate(c, terminals, 1))).not.toThrow()
  })
})

describe('gepm.compute()', function () {
  it('should exist', function () {
    expect(typeof gepm.compute).toBe('function')
  })
})