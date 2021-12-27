import seedRandom from "seedrandom"
import { Context, Suite } from "mocha"
import * as aether from "../../prod"
import { expect } from "chai"
import { fail } from "assert"

export type NumberGen = () => number

export type MultiDimArray = number[] | MultiDimArray[]

export class MathContext<D extends aether.Dim, V extends aether.VecMath<D>, M extends aether.MatMath<D>> {
    
    readonly vecGen: () => aether.Vec<D>
    readonly matGen: () => aether.Mat<D>
    
    constructor(readonly gen: NumberGen, readonly vec: V, readonly mat: M) {
        this.vecGen = vec.gen(gen)
        this.matGen = mat.gen(this.vecGen)
    }

    *scalars() {
        while (true) {
            yield this.gen()
        }
    }

    *vectors() {
        while (true) {
            yield this.vecGen()
        }
    }

    *matrices() {
        while (true) {
            yield this.matGen()
        }
    }

    expectToBeParallel(v1: aether.Vec<D>, v2: aether.Vec<D>) {
        expect(Math.abs(this.vec.dot(v1, v2))).to.be.closeTo(this.vec.length(v1) * this.vec.length(v2), EPSILON)
    }    

    expectToBePerpendicular(v1: aether.Vec<D>, v2: aether.Vec<D>) {
        expect(Math.abs(this.vec.dot(v1, v2))).to.be.closeTo(0, EPSILON)
    }    

    expectToBeInSameDirection(v1: aether.Vec<D>, v2: aether.Vec<D>) {
        expect(this.vec.dot(v1, v2)).to.be.greaterThan(EPSILON)
    }    

    expectToBeInOppositeDirection(v1: aether.Vec<D>, v2: aether.Vec<D>) {
        expect(this.vec.dot(v1, v2)).to.be.lessThan(-EPSILON)
    }

    expectToBeOrthogonal(m: aether.Mat<D>) {
        expect(this.mat.mul(m, this.mat.transpose(m))).to.satisfy(approximateEquality(this.mat.identity()))
    }

}

export type Math4Context = MathContext<4, aether.ImmutableVec4Math, aether.Mat4Math>
export type Math3Context = MathContext<3, aether.ImmutableVec3Math, aether.Mat3Math>
export type Math2Context = MathContext<2, aether.ImmutableVec2Math, aether.Mat2Math>

export function math4(gen: NumberGen): Math4Context {
    return new MathContext(gen, aether.vec4, aether.mat4)
}

export function math3(gen: NumberGen): Math3Context {
    return new MathContext(gen, aether.vec3, aether.mat3)
}

export function math2(gen: NumberGen): Math2Context {
    return new MathContext(gen, aether.vec2, aether.mat2)
}

export const EPSILON = Math.pow(2, -24)

export function approximateEquality(expected: MultiDimArray, epsilon: number = EPSILON): (actual: MultiDimArray) => boolean {
    return actual => {
        if (actual === expected) {
            return true
        }
        expect(actual.length).to.equal(expected.length)
        for (let i = 0; i < expected.length; i++) {
            const e = expected[i]
            const a = actual[i]
            if (typeof e === 'number' && typeof a === 'number') {
                expect(a).to.be.approximately(e, epsilon)
            } else if (typeof e === 'object' && typeof a === 'object') {
                approximateEquality(e)(a)
            } else {
                fail(`expected ${e} !== actual ${a}`)
            }
        }
        return true
    }
}

export function withMaths(f: (math4: Math4Context, math3: Math3Context, math2: Math2Context) => void): (this: Context | Suite) => void {
    return function() {
        const gen = numberGen(this)
        f(math4(gen), math3(gen), math2(gen))
    }
}

export function forEachMath(f: { <D extends aether.Dim, V extends aether.VecMath<D>, M extends aether.MatMath<D>>(mathContext: MathContext<D, V, M>): void }): (this: Context | Suite) => void {
    return withMaths((math4, math3, math2) => {
        f(math2)
        f(math3)
        f(math4)
    })
}

export function using(f: (gen: NumberGen) => void): (this: Context | Suite) => void {
    return function() {
        f(numberGen(this))
    }
}

function numberGen(c: Context | Suite): NumberGen {
    const path = c instanceof Context ? 
        c.currentTest?.titlePath() ?? [] : 
        c.titlePath()
    const concatenatedPath = path.reduce((p, c) => p + "/" + c, "")
    const gen = seedRandom(concatenatedPath)
    return () => 2 * gen() - 1
}
