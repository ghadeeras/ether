import { expect } from "chai"
import { approximateEquality, forEachMath, using } from "./test.utils"

describe("matrix", using(() => {

    describe("addition", using(() => {

        it("is commutative", forEachMath(math => {
            const [m1, m2] = math.matrices()
            const m12 = math.mat.add(m1, m2)
            const m21 = math.mat.add(m2, m1)
            expect(m12).to.satisfy(approximateEquality(m21))
        }))
    
        it("is associative", forEachMath(math => {
            const [m1, m2, m3] = math.matrices()
            const m1_23 = math.mat.add(m1, math.mat.add(m2, m3))
            const m12_3 = math.mat.add(math.mat.add(m1, m2), m3)
            expect(m1_23).to.satisfy(approximateEquality(m12_3))
        }))
    
    }))

    describe("subtraction", using(() => {

        it("negates addition", forEachMath(math => {
            const [m1, m2] = math.matrices()
            const m1p2 = math.mat.add(m1, m2)
            const m1p2m2 = math.mat.sub(m1p2, m2)
            expect(m1p2m2).to.satisfy(approximateEquality(m1))
        }))

    }))

    describe("scaling", using(() => {

        it("is associative", forEachMath(math => {
            const m = math.matGen()
            const [s1, s2] = math.scalars()
            const m_12 = math.mat.scale(m, s1 * s2)
            const m1_2 = math.mat.scale(math.mat.scale(m, s1), s2)
            expect(m_12).to.satisfy(approximateEquality(m1_2))
        }))
    
        it("is distributive 1", forEachMath(math => {
            const s = math.gen()
            const [m1, m2] = math.matrices()
            const m12_s = math.mat.scale(math.mat.add(m1, m2), s)
            const m1s_m2s = math.mat.add(math.mat.scale(m1, s), math.mat.scale(m2, s))
            expect(m12_s).to.satisfy(approximateEquality(m1s_m2s))
        }))
    
        it("is distributive 2", forEachMath(math => {
            const [s1, s2] = math.scalars()
            const m = math.matGen()
            const m_s12 = math.mat.scale(m, s1 + s2)
            const ms1_ms2 = math.mat.add(math.mat.scale(m, s1), math.mat.scale(m, s2))
            expect(m_s12).to.satisfy(approximateEquality(ms1_ms2))
        }))
    
    }))

    describe("multiplication", using(() => {

        it("has identity", forEachMath(math => {
            const m = math.matGen()
            const i = math.mat.identity()
            const m_i = math.mat.mul(m, i)
            const i_m = math.mat.mul(i, m)
            expect(m_i).to.deep.equal(m)
            expect(i_m).to.deep.equal(m)
        }))

        it("is associative", forEachMath(math => {
            const [m1, m2, m3] = math.matrices()
            const m1_23 = math.mat.mul(m1, math.mat.mul(m2, m3))
            const m12_3 = math.mat.mul(math.mat.mul(m1, m2), m3)
            expect(m1_23).to.satisfy(approximateEquality(m12_3))
        }))
    
        it("is distributive 1", forEachMath(math => {
            const [m1, m2, m3] = math.matrices()
            const m12_3 = math.mat.mul(math.mat.add(m1, m2), m3)
            const m13_m23 = math.mat.add(math.mat.mul(m1, m3),  math.mat.mul(m2, m3))
            expect(m12_3).to.satisfy(approximateEquality(m13_m23))
        }))
    
        it("is distributive 2", forEachMath(math => {
            const [m1, m2, m3] = math.matrices()
            const m1_23 = math.mat.mul(m1, math.mat.add(m2, m3))
            const m12_m13 = math.mat.add(math.mat.mul(m1, m2),  math.mat.mul(m1, m3))
            expect(m1_23).to.satisfy(approximateEquality(m12_m13))
        }))
    
        it("allows scalar factorization", forEachMath(math => {
            const s = math.gen()
            const [m1, m2] = math.matrices()
            const m1_2s = math.mat.mul(m1, math.mat.scale(m2, s))
            const m1s_2 = math.mat.mul(math.mat.scale(m1, s), m2)
            const m12_s = math.mat.scale(math.mat.mul(m1, m2), s)
            expect(m1_2s).to.satisfy(approximateEquality(m12_s))
            expect(m1s_2).to.satisfy(approximateEquality(m12_s))
        }))

        it("satisfies the transpose rule", forEachMath(math => {
            const [m1, m2] = math.matrices()
            const m12_T = math.mat.transpose(math.mat.mul(m1, m2))
            const m2T_m1T = math.mat.mul(math.mat.transpose(m2), math.mat.transpose(m1))
            expect(m12_T).to.satisfy(approximateEquality(m2T_m1T))
        }))
    
    }))

}))
