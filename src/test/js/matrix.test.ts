import { expect } from "chai"
import { approximateEquality, EPSILON, forEachMath, using, withMaths } from "./test.utils"

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

    describe("determinant", using(() => {

        it("produces 1 for identity matrix", forEachMath(math => {
            expect(math.mat.determinant(math.mat.identity())).to.equal(1)
        }))

        it("produces same determinant for transpose matrix", forEachMath(math => {
            const m = math.matGen()
            const mT = math.mat.transpose(m)
            expect(math.mat.determinant(mT)).to.be.closeTo(math.mat.determinant(m), EPSILON)
        }))

        it("produces reciprocal determinant for inverse matrix", forEachMath(math => {
            const m = math.matGen()
            const invM = math.mat.inverse(m)
            const detM = math.mat.determinant(m)
            const detInvM = math.mat.determinant(invM)
            expect(detInvM * detM).to.be.closeTo(1, EPSILON)
        }))

        it("produces product of determinants for matrix product", forEachMath(math => {
            const [m1, m2] = math.matrices()
            const m = math.mat.mul(m1, m2)
            const [det, det1, det2] = [math.mat.determinant(m), math.mat.determinant(m1), math.mat.determinant(m2)] 
            expect(det).to.be.closeTo(det1 * det2, EPSILON)
        }))

        it("produces zero for outer products", forEachMath(math => {
            const [v1, v2] = math.vectors()
            const m = math.mat.outer(v1, v2)
            expect(math.mat.determinant(m)).to.be.closeTo(0, EPSILON)
        }))

    }))

    describe("inverse", using(() => {

        it("inverses a matrix", forEachMath(math => {
            const m = math.matGen()
            const invM = math.mat.inverse(m)
            const i1 = math.mat.mul(m, invM)
            const i2 = math.mat.mul(invM, m)
            expect(i1).to.satisfy(approximateEquality(math.mat.identity()))
            expect(i2).to.satisfy(approximateEquality(math.mat.identity()))
        }))
        
    }))

    describe("translation", using(() => {

        it("has determinant equal to 1", withMaths((math4, math3) => {
            const v = math3.vecGen()
            const m = math4.mat.translation(v)
            expect(math4.mat.determinant(m)).to.be.closeTo(1, EPSILON)
        }))

        it("is equivalent to identity for a 0 translation", withMaths(math4 => {
            const m = math4.mat.translation([0, 0, 0])
            expect(m).to.satisfy(approximateEquality(math4.mat.identity()))
        }))

        it("has inverse equivalent to opposite translation", withMaths((math4, math3) => {
            const v = math3.vecGen()
            const m = math4.mat.translation(v)
            const oppositeM = math4.mat.translation(math3.vec.neg(v))
            const inverseM = math4.mat.inverse(m)
            expect(inverseM).to.satisfy(approximateEquality(oppositeM))
        }))

        it("translates a point", withMaths((math4, math3) => {
            const v = math3.vecGen()
            const p = math3.vecGen()
            const m = math4.mat.translation(v)
            const newP = math4.mat.apply(m, [...p, 1])
            expect(newP).to.satisfy(approximateEquality([...math3.vec.add(p, v), 1]))
        }))

        it("does not change a direction", withMaths((math4, math3) => {
            const v = math3.vecGen()
            const d = math3.vecGen()
            const m = math4.mat.translation(v)
            const newD = math4.mat.apply(m, [...d, 0])
            expect(newD).to.satisfy(approximateEquality([...d, 0]))
        }))

    }))

    describe("rotation", using(() => {

        it("has determinant equal to 1", withMaths((math4, math3, math2) => {
            const v = math3.vecGen()
            const a = math3.gen()
            const m4 = math4.mat.rotation(a, v)
            const m3 = math3.mat.rotation(a, v)
            const m2 = math2.mat.rotation(a)
            expect(math4.mat.determinant(m4)).to.be.closeTo(1, EPSILON)
            expect(math3.mat.determinant(m3)).to.be.closeTo(1, EPSILON)
            expect(math2.mat.determinant(m2)).to.be.closeTo(1, EPSILON)
        }))

        it("is orthogonal", withMaths((math4, math3, math2) => {
            const v = math3.vecGen()
            const a = math3.gen()
            const m4 = math4.mat.rotation(a, v)
            const m3 = math3.mat.rotation(a, v)
            const m2 = math2.mat.rotation(a)
            math4.expectToBeOrthogonal(m4)
            math3.expectToBeOrthogonal(m3)
            math2.expectToBeOrthogonal(m2)
        }))

        it("is equivalent to identity for 0 angle", withMaths((math4, math3, math2) => {
            const v = math3.vecGen()
            const m4 = math4.mat.rotation(0, v)
            const m3 = math3.mat.rotation(0, v)
            const m2 = math2.mat.rotation(0)
            expect(m4).to.satisfy(approximateEquality(math4.mat.identity()))
            expect(m3).to.satisfy(approximateEquality(math3.mat.identity()))
            expect(m2).to.satisfy(approximateEquality(math2.mat.identity()))
        }))

        it("has inverse equal to rotation with negated angle", withMaths((math4, math3, math2) => {
            const v = math3.vecGen()
            const a = math3.gen()
            const m4 = math4.mat.rotation(a, v)
            const m3 = math3.mat.rotation(a, v)
            const m2 = math2.mat.rotation(a)
            expect(math4.mat.inverse(m4)).to.satisfy(approximateEquality(math4.mat.rotation(-a, v)))
            expect(math3.mat.inverse(m3)).to.satisfy(approximateEquality(math3.mat.rotation(-a, v)))
            expect(math2.mat.inverse(m2)).to.satisfy(approximateEquality(math2.mat.rotation(-a)))
        }))

        it("adds angles when multiplied", withMaths((math4, math3, math2) => {
            const v = math3.vecGen()
            const [a1, a2] = math3.scalars()

            const m4_1 = math4.mat.rotation(a1, v)
            const m3_1 = math3.mat.rotation(a1, v)
            const m2_1 = math2.mat.rotation(a1)

            const m4_2 = math4.mat.rotation(a2, v)
            const m3_2 = math3.mat.rotation(a2, v)
            const m2_2 = math2.mat.rotation(a2)

            const m4_12 = math4.mat.rotation(a1 + a2, v)
            const m3_12 = math3.mat.rotation(a1 + a2, v)
            const m2_12 = math2.mat.rotation(a1 + a2)

            expect(math4.mat.mul(m4_1, m4_2)).to.satisfy(approximateEquality(m4_12))
            expect(math3.mat.mul(m3_1, m3_2)).to.satisfy(approximateEquality(m3_12))
            expect(math2.mat.mul(m2_1, m2_2)).to.satisfy(approximateEquality(m2_12))
        }))

        it("is periodic", withMaths((math4, math3, math2) => {
            const v = math3.vecGen()
            const a = math3.gen()
            const n = Math.round(math3.gen() * 100)
            const m4 = math4.mat.rotation(a, v)
            const m3 = math3.mat.rotation(a, v)
            const m2 = math2.mat.rotation(a)
            expect(m4).to.satisfy(approximateEquality(math4.mat.rotation(a + 2 * Math.PI * n, v)))
            expect(m3).to.satisfy(approximateEquality(math3.mat.rotation(a + 2 * Math.PI * n, v)))
            expect(m2).to.satisfy(approximateEquality(math2.mat.rotation(a + 2 * Math.PI * n)))
        }))

        it("is equivalent to rotationX if axis is unit x vector", withMaths((math4, math3) => {
            const a = math3.gen()
            const m4 = math4.mat.rotation(a, [1, 0, 0])
            const m3 = math3.mat.rotation(a, [1, 0, 0])
            expect(m4).to.satisfy(approximateEquality(math4.mat.rotationX(a)))
            expect(m3).to.satisfy(approximateEquality(math3.mat.rotationX(a)))
        }))

        it("is equivalent to rotationY if axis is unit y vector", withMaths((math4, math3) => {
            const a = math3.gen()
            const m4 = math4.mat.rotation(a, [0, 1, 0])
            const m3 = math3.mat.rotation(a, [0, 2, 0])
            expect(m4).to.satisfy(approximateEquality(math4.mat.rotationY(a)))
            expect(m3).to.satisfy(approximateEquality(math3.mat.rotationY(a)))
        }))

        it("is equivalent to rotationZ if axis is unit z vector", withMaths((math4, math3) => {
            const a = math3.gen()
            const m4 = math4.mat.rotation(a, [0, 0, 1])
            const m3 = math3.mat.rotation(a, [0, 0, 1])
            expect(m4).to.satisfy(approximateEquality(math4.mat.rotationZ(a)))
            expect(m3).to.satisfy(approximateEquality(math3.mat.rotationZ(a)))
        }))

        it("has a cross product based rotation equivalent", withMaths((math4, math3) => {
            const [v, v1] = math3.vectors()
            const a = math3.gen()
            const m = math3.mat.rotation(a, v)
            const v2 = math3.mat.apply(m, v1)
            const mx = math3.mat.crossProdRotation(math3.vec.reject(v1, v), math3.vec.reject(v2, v))
            expect(mx).to.satisfy(approximateEquality(m))
        }))

    }))

    describe("scalingAlong", using(() => {

        it("has determinant equal to volume/area increase caused by scaling", withMaths((math4, math3, math2) => {
            const [s1, s2] = math4.scalars()
            const m4 = math4.mat.scalingAlong(math3.vecGen(), s1, s2)
            const m3 = math3.mat.scalingAlong(math3.vecGen(), s1, s2)
            const m2 = math2.mat.scalingAlong(math2.vecGen(), s1, s2)
            expect(math4.mat.determinant(m4)).to.be.closeTo(s1 * s2 * s2, EPSILON)
            expect(math3.mat.determinant(m3)).to.be.closeTo(s1 * s2 * s2, EPSILON)
            expect(math2.mat.determinant(m2)).to.be.closeTo(s1 * s2, EPSILON)
        }))

        it("is equivalent to identity for scaling equal to 1", withMaths((math4, math3, math2) => {
            const m4 = math4.mat.scalingAlong(math3.vecGen(), 1, 1)
            const m3 = math3.mat.scalingAlong(math3.vecGen(), 1, 1)
            const m2 = math2.mat.scalingAlong(math2.vecGen(), 1, 1)
            expect(m4).to.satisfy(approximateEquality(math4.mat.identity()))
            expect(m3).to.satisfy(approximateEquality(math3.mat.identity()))
            expect(m2).to.satisfy(approximateEquality(math2.mat.identity()))
        }))

        it("has inverse equivalent to scaling matrix with inverse factors", withMaths((math4, math3, math2) => {
            const [s1, s2] = math4.scalars()
            const [r1, r2] = [1 / s1, 1 / s2]
            const v3 = math3.vecGen()
            const v2 = math2.vecGen()
            const m4 = math4.mat.scalingAlong(v3, s1, s2)
            const m3 = math3.mat.scalingAlong(v3, s1, s2)
            const m2 = math2.mat.scalingAlong(v2, s1, s2)
            expect(math4.mat.inverse(m4)).to.satisfy(approximateEquality(math4.mat.scalingAlong(v3, r1, r2)))
            expect(math3.mat.inverse(m3)).to.satisfy(approximateEquality(math3.mat.scalingAlong(v3, r1, r2)))
            expect(math2.mat.inverse(m2)).to.satisfy(approximateEquality(math2.mat.scalingAlong(v2, r1, r2)))
        }))

        it("multiplies scaling factors when multiplied", withMaths((math4, math3, math2) => {
            const [s1, s2, s3, s4] = math4.scalars()
            const v3 = math3.vecGen()
            const v2 = math2.vecGen()
            
            const m4_1 = math4.mat.scalingAlong(v3, s1, s2)
            const m3_1 = math3.mat.scalingAlong(v3, s1, s2)
            const m2_1 = math2.mat.scalingAlong(v2, s1, s2)
            
            const m4_2 = math4.mat.scalingAlong(v3, s3, s4)
            const m3_2 = math3.mat.scalingAlong(v3, s3, s4)
            const m2_2 = math2.mat.scalingAlong(v2, s3, s4)
            
            expect(math4.mat.mul(m4_1, m4_2)).to.satisfy(approximateEquality(math4.mat.scalingAlong(v3, s1 * s3, s2 * s4)))
            expect(math3.mat.mul(m3_1, m3_2)).to.satisfy(approximateEquality(math3.mat.scalingAlong(v3, s1 * s3, s2 * s4)))
            expect(math2.mat.mul(m2_1, m2_2)).to.satisfy(approximateEquality(math2.mat.scalingAlong(v2, s1 * s3, s2 * s4)))
        }))

        it("has has simpler functions for scaling along main axes", withMaths((math4, math3, math2) => {
            const [s1, s2] = math4.scalars()

            expect(math4.mat.scalingAlong([1, 0, 0], s1, s2)).to.satisfy(approximateEquality(math4.mat.scaling(s1, s2, s2)))
            expect(math3.mat.scalingAlong([1, 0, 0], s1, s2)).to.satisfy(approximateEquality(math3.mat.scaling(s1, s2, s2)))
            expect(math2.mat.scalingAlong([1, 0], s1, s2)).to.satisfy(approximateEquality(math2.mat.scaling(s1, s2)))

            expect(math4.mat.scalingAlong([0, 1, 0], s1, s2)).to.satisfy(approximateEquality(math4.mat.scaling(s2, s1, s2)))
            expect(math3.mat.scalingAlong([0, 1, 0], s1, s2)).to.satisfy(approximateEquality(math3.mat.scaling(s2, s1, s2)))
            expect(math2.mat.scalingAlong([0, 1], s1, s2)).to.satisfy(approximateEquality(math2.mat.scaling(s2, s1)))

            expect(math4.mat.scalingAlong([0, 0, 1], s1, s2)).to.satisfy(approximateEquality(math4.mat.scaling(s2, s2, s1)))
            expect(math3.mat.scalingAlong([0, 0, 1], s1, s2)).to.satisfy(approximateEquality(math3.mat.scaling(s2, s2, s1)))
        }))

    }))

}))

