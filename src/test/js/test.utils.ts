import seedRandom from "seedrandom"
import { Context, Suite } from "mocha"
import { Dim, Mat, mat2, mat3, mat4, MatMath, Vec, vec2, vec3, vec4, VecMath } from "../../prod"
import { expect } from "chai"
import { fail } from "assert"

export type NumberGen = () => number

export type MultiDimArray = number[] | MultiDimArray[]

export class MathContext<D extends Dim> {
    
    readonly vecGen: () => Vec<D>
    readonly matGen: () => Mat<D>
    
    constructor(readonly gen: NumberGen, readonly vec: VecMath<D>, readonly mat: MatMath<D>) {
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

    expectToBeParallel(v1: Vec<D>, v2: Vec<D>) {
        expect(Math.abs(this.vec.dot(v1, v2))).to.be.closeTo(this.vec.length(v1) * this.vec.length(v2), EPSILON)
    }    

    expectToBePerpendicular(v1: Vec<D>, v2: Vec<D>) {
        expect(Math.abs(this.vec.dot(v1, v2))).to.be.closeTo(0, EPSILON)
    }    

    expectToBeInSameDirection(v1: Vec<D>, v2: Vec<D>) {
        expect(this.vec.dot(v1, v2)).to.be.greaterThan(EPSILON)
    }    

    expectToBeInOppositeDirection(v1: Vec<D>, v2: Vec<D>) {
        expect(this.vec.dot(v1, v2)).to.be.lessThan(-EPSILON)
    }    

}

export function math4(gen: NumberGen): MathContext<4> {
    return new MathContext(gen, vec4, mat4)
}

export function math3(gen: NumberGen): MathContext<3> {
    return new MathContext(gen, vec3, mat3)
}

export function math2(gen: NumberGen): MathContext<2> {
    return new MathContext(gen, vec2, mat2)
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

export function forEachMath(f: { <D extends Dim>(mathContext: MathContext<D>): void }): (this: Context | Suite) => void {
    return function() {
        const gen = numberGen(this)
        f(new MathContext(gen, vec2, mat2))
        f(new MathContext(gen, vec3, mat3))
        f(new MathContext(gen, vec4, mat4))
    }
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
