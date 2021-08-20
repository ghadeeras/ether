import { expect } from "chai"
import { approximateEquality, forEachMath, using } from "./test.utils"

describe("vector", using(() => {

    describe("addition", using(() => {

        it("is commutative", forEachMath(math => {
            const [v1, v2] = math.vectors()
            const v12 = math.vec.add(v1, v2)
            const v21 = math.vec.add(v2, v1)
            expect(v12).to.satisfy(approximateEquality(v21))
        }))
    
        it("is associative", forEachMath(math => {
            const [v1, v2, v3] = math.vectors()
            const v1_23 = math.vec.add(v1, math.vec.add(v2, v3))
            const v12_3 = math.vec.add(math.vec.add(v1, v2), v3)
            expect(v1_23).to.satisfy(approximateEquality(v12_3))
        }))
    
    }))

    describe("scaling", using(() => {

        it("is associative", forEachMath(math => {
            const v = math.vecGen()
            const [s1, s2] = math.scalars()
            const v_12 = math.vec.scale(v, s1 * s2)
            const v1_2 = math.vec.scale(math.vec.scale(v, s1), s2)
            expect(v_12).to.satisfy(approximateEquality(v1_2))
        }))
    
        it("is distributive 1", forEachMath(math => {
            const s = math.gen()
            const [v1, v2] = math.vectors()
            const v12_s = math.vec.scale(math.vec.add(v1, v2), s)
            const v1s_v2s =math.vec.add( math.vec.scale(v1, s),  math.vec.scale(v2, s))
            expect(v12_s).to.satisfy(approximateEquality(v1s_v2s))
        }))
    
        it("is distributive 2", forEachMath(math => {
            const [s1, s2] = math.scalars()
            const v = math.vecGen()
            const v_s12 = math.vec.scale(v, s1 + s2)
            const vs1_vs2 =math.vec.add(math.vec.scale(v, s1),  math.vec.scale(v, s2))
            expect(v_s12).to.satisfy(approximateEquality(vs1_vs2))
        }))
    
    }))

    describe("subtraction", using(() => {

        it("negates addition", forEachMath(math => {
            const [v1, v2] = math.vectors()
            const v1p2 = math.vec.add(v1, v2)
            const v1p2m2 = math.vec.sub(v1p2, v2)
            expect(v1p2m2).to.satisfy(approximateEquality(v1))
        }))

    }))

}))

