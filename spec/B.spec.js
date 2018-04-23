const B = require('../B')

const _ = require('lodash')

describe('B', function () {
  it('should exist', function () {
    expect(_.isObject(B)).toBe(true)
  })

  describe('B.bus', function () {
    it('should exist', function () {
      expect(typeof B.bus).toBe('function')
    })

    it('should return a BitStream', function () {
      const bus = B.bus()

      expect(typeof bus.push).toBe('function')

      expect(typeof bus.subscribe).toBe('function')
    })

    it('should emit the value to subscribers', function (done) {
      const bus = B.bus()

      bus.subscribe(function (value) {
        expect(value).toBe(true)

        done()
      })

      bus.push(true)
    })
  })

  describe('B.and', function () {
    it('should exist', function () {
      expect(typeof B.and).toBe('function')
    })

    it('should emit false if the source streams emit false', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.and(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(false)
      })

      source1.push(false)
      source2.push(false)
    })

    it('should emit false if the source1 stream emits false', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.and(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(false)
      })

      source1.push(false)
      source2.push(true)
    })

    it('should emit false if the source2 stream emits false', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.and(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(false)
      })

      source1.push(true)
      source2.push(false)
    })

    it('should emit true if both streams emit true', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.and(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(true)
      })

      source1.push(true)
      source2.push(true)
    })
  })

  describe('B.or', function () {
    it('should exist', function () {
      expect(typeof B.or).toBe('function')
    })

    it('should emit false if the source streams emit false', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.or(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(false)
      })

      source1.push(false)
      source2.push(false)
    })

    it('should emit true if the source1 stream emits false', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.or(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(true)
      })

      source1.push(false)
      source2.push(true)
    })

    it('should emit true if the source2 stream emits false', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.or(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(true)
      })

      source1.push(true)
      source2.push(false)
    })

    it('should emit true if both streams emit true', function () {
      const source1 = B.bus()
      const source2 = B.bus()

      const andOp = B.or(source1, source2)

      andOp.subscribe(function (value) {
        expect(value).toBe(true)
      })

      source1.push(true)
      source2.push(true)
    })
  })

  describe('B.not', function () {
    it('should exist', function () {
      expect(typeof B.not).toBe('function')
    })

    it('should emit false if the source stream emits true', function () {
      const source1 = B.bus()

      const andOp = B.not(source1)

      andOp.subscribe(function (value) {
        expect(value).toBe(false)
      })

      source1.push(true)
    })

    it('should emit true if the source stream emits false', function () {
      const source1 = B.bus()

      const andOp = B.not(source1)

      andOp.subscribe(function (value) {
        expect(value).toBe(true)
      })

      source1.push(false)
    })
  })

  describe('B.mem', function () {
    it('should exist', function () {
      expect(typeof B.mem).toBe('function')
    })
  })
})