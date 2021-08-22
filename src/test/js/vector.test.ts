import { expect } from "chai"
import { vec2, vec3 } from "../../prod"
import { approximateEquality, EPSILON, forEachMath, math2, math3, using } from "./test.utils"

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

    describe("subtraction", using(() => {

        it("negates addition", forEachMath(math => {
            const [v1, v2] = math.vectors()
            const v1p2 = math.vec.add(v1, v2)
            const v1p2m2 = math.vec.sub(v1p2, v2)
            expect(v1p2m2).to.satisfy(approximateEquality(v1))
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
            const v1s_v2s = math.vec.add( math.vec.scale(v1, s),  math.vec.scale(v2, s))
            expect(v12_s).to.satisfy(approximateEquality(v1s_v2s))
        }))
    
        it("is distributive 2", forEachMath(math => {
            const [s1, s2] = math.scalars()
            const v = math.vecGen()
            const v_s12 = math.vec.scale(v, s1 + s2)
            const vs1_vs2 = math.vec.add(math.vec.scale(v, s1),  math.vec.scale(v, s2))
            expect(v_s12).to.satisfy(approximateEquality(vs1_vs2))
        }))
    
    }))

    describe("dot product", using(() => {

        it("is commutative", forEachMath(math => {
            const [v1, v2] = math.vectors()
            const v12 = math.vec.dot(v1, v2)
            const v21 = math.vec.dot(v2, v1)
            expect(v12).to.be.closeTo(v21, EPSILON)
        }))    

        it("is distributive", forEachMath(math => {
            const [v1, v2, v3] = math.vectors()
            const v12_3 = math.vec.dot(math.vec.add(v1, v2), v3)
            const v13_23 = math.vec.dot(v1, v3) + math.vec.dot(v2, v3)
            expect(v13_23).to.be.closeTo(v12_3, EPSILON)
        }))    

        it("allows scalar factorization", forEachMath(math => {
            const s = math.gen()
            const [v1, v2] = math.vectors()
            const v1_2s = math.vec.dot(v1, math.vec.scale(v2, s))
            const v1s_2 = math.vec.dot(math.vec.scale(v1, s), v2)
            const v12_s = math.vec.dot(v1, v2) * s
            expect(v1_2s).to.be.closeTo(v12_s, EPSILON)
            expect(v1s_2).to.be.closeTo(v12_s, EPSILON)
        }))

        it("produces product of lengths for parallel vectors", forEachMath(math => {
            const v = math.vecGen()
            const s = Math.abs(math.gen())
            const [v1, v2] = [math.vec.scale(v, s), math.vec.scale(v, -s)] 
            const [l, l1, l2] = [math.vec.length(v),  math.vec.length(v1), math.vec.length(v2)]
            expect(math.vec.dot(v, v1)).to.be.closeTo(+l * l1, EPSILON)
            expect(math.vec.dot(v, v2)).to.be.closeTo(-l * l2, EPSILON)
        }))    

    }))

    describe("cross product", using(gen => {

        const m3 = math3(gen)
        const m2 = math2(gen)

        it("is anti-commutative", using(() => {
            const [v3D1, v3D2] = m3.vectors()
            const v3D12 = vec3.cross(v3D1, v3D2)
            const v3D21 = vec3.cross(v3D2, v3D1)
            expect(v3D21).to.satisfy(approximateEquality(vec3.neg(v3D12)))

            const [v2D1, v2D2] = m2.vectors()
            const s2D12 = vec2.cross(v2D1, v2D2)
            const s2D21 = vec2.cross(v2D2, v2D1)
            expect(s2D21).to.be.closeTo(-s2D12, EPSILON)
        }))

        it("produces zero if operands are parallel", using(gen => {
            const s = gen()

            const v3D1 = m3.vecGen()
            const v3D2 = m3.vec.scale(v3D1, s)
            const v3D = vec3.cross(v3D1, v3D2)
            expect(v3D).to.satisfy(approximateEquality([0, 0, 0]))

            const v2D1 = m2.vecGen()
            const v2D2 = m2.vec.scale(v2D1, s)
            const s2D = vec2.cross(v2D1, v2D2)
            expect(s2D).to.be.closeTo(0, EPSILON)
        }))

        it("produces a vector perpendicular on operand vectors", using(() => {
            const [v3D1, v3D2] = m3.vectors()
            const v3D = vec3.cross(v3D1, v3D2)
            expect(vec3.dot(v3D, v3D1)).to.closeTo(0, EPSILON)
            expect(vec3.dot(v3D, v3D2)).to.closeTo(0, EPSILON)
        }))

        it("is distributive", using(() => {
            const [v3D1, v3D2, v3D3] = m3.vectors()
            const v3D12_3 = vec3.cross(vec3.add(v3D1, v3D2), v3D3)
            const v3D13_23 = vec3.add(vec3.cross(v3D1, v3D3), vec3.cross(v3D2, v3D3))
            expect(v3D13_23).to.satisfy(approximateEquality(v3D12_3))

            const [v2D1, v2D2, v2D3] = m2.vectors()
            const s12_3 = vec2.cross(vec2.add(v2D1, v2D2), v2D3)
            const s13_23 = vec2.cross(v2D1, v2D3) + vec2.cross(v2D2, v2D3)
            expect(s13_23).to.be.closeTo(s12_3, EPSILON)
        }))    

        it("allows scalar factorization", using(gen => {
            const s = gen()
            
            const [v3D1, v3D2] = m3.vectors()
            const v1_2s = vec3.cross(v3D1, vec3.scale(v3D2, s))
            const v1s_2 = vec3.cross(vec3.scale(v3D1, s), v3D2)
            const v12_s = vec3.scale(vec3.cross(v3D1, v3D2), s)
            expect(v1_2s).to.satisfy(approximateEquality(v12_s))
            expect(v1s_2).to.satisfy(approximateEquality(v12_s))

            const [v2D1, v2D2] = m2.vectors()
            const s1_2s = vec2.cross(v2D1, vec2.scale(v2D2, s))
            const s1s_2 = vec2.cross(vec2.scale(v2D1, s), v2D2)
            const s12_s = vec2.cross(v2D1, v2D2) * s
            expect(s1_2s).to.be.closeTo(s12_s, EPSILON)
            expect(s1s_2).to.be.closeTo(s12_s, EPSILON)
        }))

        it("satisfied the vector triple product identity", using(() => {
            const [a, b, c] = m3.vectors()
            const abc = vec3.cross(a, vec3.cross(b, c))
            const b_ac = vec3.scale(b, vec3.dot(a, c))
            const c_ab = vec3.scale(c, vec3.dot(a, b))
            expect(abc).to.satisfy(approximateEquality(vec3.sub(b_ac, c_ab)))
        }))

        it("satisfied the lagrange identity", using(() => {
            const [a, b] = m3.vectors()
            const axb2 = vec3.lengthSquared(vec3.cross(a, b))
            const a2b2 = vec3.lengthSquared(a) * vec3.lengthSquared(b)
            const ab2 = Math.pow(vec3.dot(a, b), 2)
            expect(axb2).to.be.closeTo(a2b2 - ab2, EPSILON)
        }))

    }))

}))

