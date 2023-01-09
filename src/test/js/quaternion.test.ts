import { expect } from "chai"
import { quat } from "../../prod/index.js"
import { approximateEquality, using, withMaths } from "./test.utils.js"

describe("quaternion", using(() => {

    describe("conjugate", using(() => {

        it("gives real part (doubled) when added to original quaternion", withMaths(math4 => {
            const q = math4.vecGen()
            const qConj = quat.conj(q)
            expect(quat.add(q, qConj)).to.satisfy(approximateEquality([0, 0, 0, 2 * q[3]]))
        }))
    
        it("gives imaginary part (doubled) when subtracted from original quaternion", withMaths(math4 => {
            const q = math4.vecGen()
            const qConj = quat.conj(q)
            expect(quat.sub(q, qConj)).to.satisfy(approximateEquality([2 * q[0], 2 * q[1], 2 * q[2], 0]))
        }))
    
        it("gives the length (squared) when multiplied by original quaternion", withMaths(math4 => {
            const q = math4.vecGen()
            const qConj = quat.conj(q)
            const qQConj = quat.mul(q, qConj)
            const qConjQ = quat.mul(qConj, q)
            expect(qQConj).to.satisfy(approximateEquality([0, 0, 0, quat.lengthSquared(q)]))
            expect(qConjQ).to.satisfy(approximateEquality([0, 0, 0, quat.lengthSquared(q)]))
        }))
    
    }))

    describe("mul", using(() => {

        it("is not commutative", withMaths(math4 => {
            const [q1, q2] = math4.vectors()
            const [q12, q21] = [quat.conj(quat.mul(q1, q2)), quat.mul(quat.conj(q2), quat.conj(q1))]
            expect(q12).to.satisfy(approximateEquality(q21))
        }))

        it("is equivalent to rotation", withMaths((math4, math3) => {
            const [axis, v] = math3.vectors()
            const angle = math3.gen()

            const q = quat.rotation(angle, axis)
            const m = math3.mat.rotation(angle, axis)

            const q1 = quat.mul(quat.mul(q, [...v, 0]), quat.conj(q))
            const q2 = [...math3.mat.apply(m, v), 0]

            expect(q1).to.satisfy(approximateEquality(q2))
        }))

    }))

    describe("transform", using(() => {

        it("is equivalent to a multiplication sandwich :-)", withMaths((math4, math3) => {
            const v = math3.vecGen()
            const q = math4.vecGen()

            const qv = [...quat.transform(q, v), 0]
            const qvq = quat.mul(quat.mul(q, [...v, 0]), quat.inverse(q))

            expect(qv).to.satisfy(approximateEquality(qvq))
        }))

    }))

    describe("inverse", using(() => {

        it("produces 1 if multiplied by original", withMaths(math4 => {
            const q = math4.vecGen()
            const qInv = quat.inverse(q)
            const one1 = quat.mul(q, qInv)
            const one2 = quat.mul(qInv, q)
            expect(one1).to.satisfy(approximateEquality([0, 0, 0, 1]))
            expect(one2).to.satisfy(approximateEquality([0, 0, 0, 1]))
        }))

    }))

    describe("toMatrix", using(() => {

        it("produces a rotation matrix", withMaths((math4, math3) => {
            const axis = math3.vecGen()
            const angle = math3.gen()

            const m1 = quat.toMatrix(quat.rotation(angle, axis))
            const m2 = math3.mat.rotation(angle, axis)

            expect(m1).to.satisfy(approximateEquality(m2))
        }))

    }))

}))