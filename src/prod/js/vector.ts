import { failure } from "./utils.js";
import { Mat } from "./matrix.js";

export type Dim = 2 | 3 | 4

export type DimMap<D extends Dim, D2, D3, D4> =
    D extends 4 ? D4 : never |
    D extends 3 ? D3 : never |
    D extends 2 ? D2 : never

export type LowerDim<D extends Dim> = DimMap<D, never, 2, 3>

export type Component<D extends Dim> = DimMap<D, (0 | 1), (0 | 1 | 2), (0 | 1 | 2 | 3)>

export type Tuple<T, D extends Dim> = DimMap<D, [T, T], [T, T, T], [T, T, T, T]> 

export type Vec<D extends Dim> = Tuple<number, D> 

export type VecDim<V extends Vec<any>> = V["length"]

export type SwizzleComponents<S extends Dim, D extends Dim> = Tuple<Component<S>, D>

export interface VecMath<D extends Dim> {

    of(...components: Vec<D>): Vec<D>

    gen(...components: [() => number] | Tuple<() => number, D>): () => Vec<D>

    add(v1: Vec<D>, v2: Vec<D>): Vec<D>

    sub(v1: Vec<D>, v2: Vec<D>): Vec<D>

    mul(v1: Vec<D>, v2: Vec<D>): Vec<D>

    div(v1: Vec<D>, v2: Vec<D>): Vec<D>

    scale(v: Vec<D>, f: number): Vec<D>

    max(v1: Vec<D>, v2: Vec<D>): Vec<D>
    
    min(v1: Vec<D>, v2: Vec<D>): Vec<D>

    addAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    subAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    maxAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    minAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    neg(v: Vec<D>): Vec<D>

    swizzle<S extends Dim>(v: Vec<S>, ...components: SwizzleComponents<S, D>): Vec<D>

    dot(v1: Vec<D>, v2: Vec<D>): number

    lengthSquared(v: Vec<D>): number

    length(v: Vec<D>): number

    unit(v: Vec<D>): Vec<D>

    mix(w: number, v1: Vec<D>, v2: Vec<D>): Vec<D>

    weightedSum(w1: number, v1: Vec<D>, w2: number, v2: Vec<D>): Vec<D>

    angle(v1: Vec<D>, v2: Vec<D>): number

    prod(v: Vec<D>, m: Mat<D>): Vec<D>

}

abstract class VecMathBase<D extends Dim> implements VecMath<D> {

    of(...components: Vec<D>): Vec<D> {
        return components
    }

    protected abstract get mutable(): MutableVecMathBase<D>

    protected abstract get immutable(): ImmutableVecMathBase<D>

    abstract gen(...components: [() => number] | Tuple<() => number, D>): () => Vec<D>
    
    abstract add(v1: Vec<D>, v2: Vec<D>): Vec<D>
    
    abstract sub(v1: Vec<D>, v2: Vec<D>): Vec<D>
    
    abstract mul(v1: Vec<D>, v2: Vec<D>): Vec<D>
    
    abstract div(v1: Vec<D>, v2: Vec<D>): Vec<D>
    
    abstract scale(v: Vec<D>, f: number): Vec<D>

    abstract max(v1: Vec<D>, v2: Vec<D>): Vec<D>
    
    abstract min(v1: Vec<D>, v2: Vec<D>): Vec<D>

    abstract addAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    abstract subAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    abstract maxAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    abstract minAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D>

    abstract neg(v: Vec<D>): Vec<D>
    
    abstract swizzle<S extends Dim>(v: Vec<S>, ...components: SwizzleComponents<S, D>): Vec<D>

    abstract dot(v1: Vec<D>, v2: Vec<D>): number

    abstract prod(v: Vec<D>, m: Mat<D>): Vec<D>

    lengthSquared(v: Vec<D>): number {
        return this.dot(v, v)
    }

    length(v: Vec<D>): number {
        return Math.sqrt(this.lengthSquared(v))
    }
    
    unit(v: Vec<D>): Vec<D> {
        return this.scale(v, 1 / this.length(v))
    }
    
    mix(w: number, v1: Vec<D>, v2: Vec<D>): Vec<D> {
        return this.add(this.scale(v1, w), this.scale(v2, 1 - w))
    }
    
    weightedSum(w1: number, v1: Vec<D>, w2: number, v2: Vec<D>): Vec<D> {
        return this.scale(this.add(this.scale(v1, w1), this.scale(v2, w2)), 1 / (w1 + w2))
    }

    angle(v1: Vec<D>, v2: Vec<D>) {
        const l1 = this.lengthSquared(v1);
        const l2 = this.lengthSquared(v2);
        const dot = this.dot(v1, v2);
        const cos2 = (dot * dot) / (l1 * l2);
        const cos2x = 2 * cos2 - 1;
        const x = Math.acos(cos2x) / 2;
        return x;
    }

}

export abstract class ImmutableVecMathBase<D extends Dim> extends VecMathBase<D> {

    addAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        return this.mutable.addAll([...v], ...vs)
    }

    subAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        return this.mutable.subAll([...v], ...vs)
    }

    maxAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        return this.mutable.maxAll([...v], ...vs)
    }

    minAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        return this.mutable.minAll([...v], ...vs)
    }

}

export class ImmutableVec4Math extends ImmutableVecMathBase<4> {

    protected get mutable(): MutableVecMathBase<4> {
        return mutVec4
    }

    protected get immutable(): ImmutableVecMathBase<4> {
        return this
    }

    gen(...components: [() => number] | Tuple<() => number, 4>): () => Vec<4> {
        const component = components[0]
        return components.length == 1 ?
            () => this.of(component(), component(), component(), component()) :
            () => this.of(components[0](), components[1](), components[2](), components[3]())
    }

    add(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1],
            v1[2] + v2[2],
            v1[3] + v2[3]
        ]
    }
    
    sub(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1],
            v1[2] - v2[2],
            v1[3] - v2[3]
        ]
    }
    
    mul(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        return [
            v1[0] * v2[0],
            v1[1] * v2[1],
            v1[2] * v2[2],
            v1[3] * v2[3]
        ]
    }
    
    div(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        return [
            v1[0] / v2[0],
            v1[1] / v2[1],
            v1[2] / v2[2],
            v1[3] / v2[3]
        ]
    }
    
    scale(v: Vec<4>, f: number): Vec<4> {
        return [
            v[0] * f,
            v[1] * f,
            v[2] * f,
            v[3] * f
        ]
    }
    
    max(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        return [
            Math.max(v1[0] , v2[0]),
            Math.max(v1[1] , v2[1]),
            Math.max(v1[2] , v2[2]),
            Math.max(v1[3] , v2[3])
        ]
    }
    
    min(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        return [
            Math.min(v1[0] , v2[0]),
            Math.min(v1[1] , v2[1]),
            Math.min(v1[2] , v2[2]),
            Math.min(v1[3] , v2[3])
        ]
    }
    
    neg(v: Vec<4>): Vec<4> {
        return [
            -v[0],
            -v[1],
            -v[2],
            -v[3]
        ]
    }
    
    swizzle<S extends Dim>(v: Vec<S>, ...components: SwizzleComponents<S, 4>): Vec<4> {
        return [
            v[components[0]] ?? failure(""),
            v[components[1]] ?? failure(""),
            v[components[2]] ?? failure(""),
            v[components[3]] ?? failure(""),
        ]
    }
    
    dot(v1: Vec<4>, v2: Vec<4>): number {
        return (
            v1[0] * v2[0] +
            v1[1] * v2[1] +
            v1[2] * v2[2] +
            v1[3] * v2[3]
        )
    }
    
    prod(v: Vec<4>, m: Mat<4>): Vec<4> {
        return [
            this.dot(v, m[0]),
            this.dot(v, m[1]),
            this.dot(v, m[2]),
            this.dot(v, m[3])
        ]
    }

}

export class ImmutableVec3Math extends ImmutableVecMathBase<3> {

    protected get mutable(): MutableVecMathBase<3> {
        return mutVec3
    }

    protected get immutable(): ImmutableVecMathBase<3> {
        return this
    }

    gen(...components: [() => number] | Tuple<() => number, 3>): () => Vec<3> {
        const component = components[0]
        return components.length == 1 ?
            () => this.of(component(), component(), component()) :
            () => this.of(components[0](), components[1](), components[2]())
    }

    add(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1],
            v1[2] + v2[2]
        ]
    }
    
    sub(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1],
            v1[2] - v2[2]
        ]
    }
    
    mul(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            v1[0] * v2[0],
            v1[1] * v2[1],
            v1[2] * v2[2]
        ]
    }
    
    div(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            v1[0] / v2[0],
            v1[1] / v2[1],
            v1[2] / v2[2]
        ]
    }
    
    scale(v: Vec<3>, f: number): Vec<3> {
        return [
            v[0] * f,
            v[1] * f,
            v[2] * f
        ]
    }
    
    max(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            Math.max(v1[0] , v2[0]),
            Math.max(v1[1] , v2[1]),
            Math.max(v1[2] , v2[2])
        ]
    }
    
    min(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            Math.min(v1[0] , v2[0]),
            Math.min(v1[1] , v2[1]),
            Math.min(v1[2] , v2[2])
        ]
    }
    
    neg(v: Vec<3>): Vec<3> {
        return [
            -v[0],
            -v[1],
            -v[2]
        ]
    }
    
    swizzle<S extends Dim>(v: Vec<S>, ...components: SwizzleComponents<S, 3>): Vec<3> {
        return [
            v[components[0]] ?? failure(""),
            v[components[1]] ?? failure(""),
            v[components[2]] ?? failure("")
        ]
    }
    
    dot(v1: Vec<3>, v2: Vec<3>): number {
        return (
            v1[0] * v2[0] +
            v1[1] * v2[1] +
            v1[2] * v2[2]
        )
    }
    
    cross(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        return [
            v1[1]*v2[2] - v1[2]*v2[1],
            v1[2]*v2[0] - v1[0]*v2[2],
            v1[0]*v2[1] - v1[1]*v2[0]
        ]
    }
    
    prod(v: Vec<3>, m: Mat<3>): Vec<3> {
        return [
            this.dot(v, m[0]),
            this.dot(v, m[1]),
            this.dot(v, m[2])
        ]
    }

    equal(v1: Vec<3>, v2: Vec<3>, precision: number = 0.001) {
        const cross = this.length(this.cross(v1, v2));
        const dot = this.dot(v1, v2);
        const tan = cross / dot;
        return tan < precision && tan > -precision;
    }

}

export class ImmutableVec2Math extends ImmutableVecMathBase<2> {

    protected get mutable(): MutableVecMathBase<2> {
        return mutVec2
    }

    protected get immutable(): ImmutableVecMathBase<2> {
        return this
    }

    gen(...components: [() => number] | Tuple<() => number, 2>): () => Vec<2> {
        const component = components[0]
        return components.length == 1 ?
            () => this.of(component(), component()) :
            () => this.of(components[0](), components[1]())
    }

    add(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1]
        ]
    }
    
    sub(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1]
        ]
    }
    
    mul(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        return [
            v1[0] * v2[0],
            v1[1] * v2[1]
        ]
    }
    
    div(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        return [
            v1[0] / v2[0],
            v1[1] / v2[1]
        ]
    }
    
    scale(v: Vec<2>, f: number): Vec<2> {
        return [
            v[0] * f,
            v[1] * f
        ]
    }
    
    max(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        return [
            Math.max(v1[0] , v2[0]),
            Math.max(v1[1] , v2[1])
        ]
    }
    
    min(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        return [
            Math.min(v1[0] , v2[0]),
            Math.min(v1[1] , v2[1])
        ]
    }
    
    neg(v: Vec<2>): Vec<2> {
        return [
            -v[0],
            -v[1]
        ]
    }
    
    swizzle<S extends Dim>(v: Vec<S>, ...components: SwizzleComponents<S, 2>): Vec<2> {
        return [
            v[components[0]] ?? failure(""),
            v[components[1]] ?? failure("")
        ]
    }
    
    dot(v1: Vec<2>, v2: Vec<2>): number {
        return (
            v1[0] * v2[0] +
            v1[1] * v2[1]
        )
    }
    
    prod(v: Vec<2>, m: Mat<2>): Vec<2> {
        return [
            this.dot(v, m[0]),
            this.dot(v, m[1])
        ]
    }

    cross(v1: Vec<2>, v2: Vec<2>): number {
        return (
            v1[0] * v2[1] - 
            v1[1] * v2[0]
        )
    }
    
    equal(v1: Vec<2>, v2: Vec<2>, precision: number = 0.001) {
        const cross = this.cross(v1, v2);
        const dot = this.dot(v1, v2);
        const tan = cross / dot;
        return tan < precision && tan > -precision;
    }

}

export abstract class MutableVecMathBase<D extends Dim> extends VecMathBase<D> {

    addAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        for (const vn of vs) {
            this.add(v, vn)
        }
        return v
    }

    subAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        for (const vn of vs) {
            this.sub(v, vn)
        }
        return v
    }

    maxAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        for (const vn of vs) {
            this.max(v, vn)
        }
        return v
    }

    minAll(v: Vec<D>, ...vs: Vec<D>[]): Vec<D> {
        for (const vn of vs) {
            this.min(v, vn)
        }
        return v
    }

    gen(...components: [() => number] | Tuple<() => number, D>): () => Vec<D> {
        return this.immutable.gen(...components)
    }

    swizzle<S extends Dim>(v: Vec<S>, ...components: SwizzleComponents<S, D>): Vec<D> {
        return this.immutable.swizzle(v, ...components)
    }
    
    dot(v1: Vec<D>, v2: Vec<D>): number {
        return this.immutable.dot(v1, v2)
    }
    
    prod(v: Vec<D>, m: Mat<D>): Vec<D> {
        return this.immutable.prod(v, m)
    }

}

export class MutableVec4Math extends MutableVecMathBase<4> {

    get mutable(): MutableVecMathBase<4> {
        return this
    }

    get immutable(): ImmutableVecMathBase<4> {
        return vec4
    }

    add(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        v1[0] += v2[0]
        v1[1] += v2[1]
        v1[2] += v2[2]
        v1[3] += v2[3]
        return v1
    }
    
    sub(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        v1[0] -= v2[0]
        v1[1] -= v2[1]
        v1[2] -= v2[2]
        v1[3] -= v2[3]
        return v1
    }
    
    mul(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        v1[0] *= v2[0]
        v1[1] *= v2[1]
        v1[2] *= v2[2]
        v1[3] *= v2[3]
        return v1
    }
    
    div(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        v1[0] /= v2[0]
        v1[1] /= v2[1]
        v1[2] /= v2[2]
        v1[3] /= v2[3]
        return v1
    }
    
    scale(v: Vec<4>, f: number): Vec<4> {
        v[0] *= f
        v[1] *= f
        v[2] *= f
        v[3] *= f
        return v
    }
    
    max(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        v1[0] = Math.max(v1[0] , v2[0])
        v1[1] = Math.max(v1[1] , v2[1])
        v1[2] = Math.max(v1[2] , v2[2])
        v1[3] = Math.max(v1[3] , v2[3])
        return v1
    }
    
    min(v1: Vec<4>, v2: Vec<4>): Vec<4> {
        v1[0] = Math.min(v1[0] , v2[0])
        v1[1] = Math.min(v1[1] , v2[1])
        v1[2] = Math.min(v1[2] , v2[2])
        v1[3] = Math.min(v1[3] , v2[3])
        return v1
    }
    
    neg(v: Vec<4>): Vec<4> {
        v[0] = -v[0]
        v[1] = -v[1]
        v[2] = -v[2]
        v[3] = -v[3]
        return v
    }
    
}

export class MutableVec3Math extends MutableVecMathBase<3> {

    get mutable(): MutableVecMathBase<3> {
        return this
    }

    get immutable(): ImmutableVecMathBase<3> {
        return vec3
    }


    add(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        v1[0] += v2[0]
        v1[1] += v2[1]
        v1[2] += v2[2]
        return v1
    }
    
    sub(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        v1[0] -= v2[0]
        v1[1] -= v2[1]
        v1[2] -= v2[2]
        return v1
    }
    
    mul(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        v1[0] *= v2[0]
        v1[1] *= v2[1]
        v1[2] *= v2[2]
        return v1
    }
    
    div(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        v1[0] /= v2[0]
        v1[1] /= v2[1]
        v1[2] /= v2[2]
        return v1
    }
    
    scale(v: Vec<3>, f: number): Vec<3> {
        v[0] *= f
        v[1] *= f
        v[2] *= f
        return v
    }
    
    max(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        v1[0] = Math.max(v1[0] , v2[0])
        v1[1] = Math.max(v1[1] , v2[1])
        v1[2] = Math.max(v1[2] , v2[2])
        return v1
    }
    
    min(v1: Vec<3>, v2: Vec<3>): Vec<3> {
        v1[0] = Math.min(v1[0] , v2[0])
        v1[1] = Math.min(v1[1] , v2[1])
        v1[2] = Math.min(v1[2] , v2[2])
        return v1
    }
    
    neg(v: Vec<3>): Vec<3> {
        v[0] = -v[0]
        v[1] = -v[1]
        v[2] = -v[2]
        return v
    }
    
}

export class MutableVec2Math extends MutableVecMathBase<2> {

    get mutable(): MutableVecMathBase<2> {
        return this
    }

    get immutable(): ImmutableVecMathBase<2> {
        return vec2
    }

    add(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        v1[0] += v2[0]
        v1[1] += v2[1]
        return v1
    }
    
    sub(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        v1[0] -= v2[0]
        v1[1] -= v2[1]
        return v1
    }
    
    mul(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        v1[0] *= v2[0]
        v1[1] *= v2[1]
        return v1
    }
    
    div(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        v1[0] /= v2[0]
        v1[1] /= v2[1]
        return v1
    }
    
    scale(v: Vec<2>, f: number): Vec<2> {
        v[0] *= f
        v[1] *= f
        return v
    }
    
    max(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        v1[0] = Math.max(v1[0] , v2[0])
        v1[1] = Math.max(v1[1] , v2[1])
        return v1
    }
    
    min(v1: Vec<2>, v2: Vec<2>): Vec<2> {
        v1[0] = Math.min(v1[0] , v2[0])
        v1[1] = Math.min(v1[1] , v2[1])
        return v1
    }
    
    neg(v: Vec<2>): Vec<2> {
        v[0] = -v[0]
        v[1] = -v[1]
        return v
    }
    
}

export const vec2 = new ImmutableVec2Math() 
export const vec3 = new ImmutableVec3Math() 
export const vec4 = new ImmutableVec4Math() 

export const mutVec2 = new MutableVec2Math() 
export const mutVec3 = new MutableVec3Math() 
export const mutVec4 = new MutableVec4Math() 

export function deleteComponent<T, D extends Dim>(tuple: Tuple<T, D>, component: Component<D>): Tuple<T, LowerDim<D>> {
    const result = new Array<T>(tuple.length - 1)
    for (let i = 0, j = 0; i < component; i++, j++) {
        result[j] = tuple[i]
    }
    for (let i = component + 1, j = component; i < tuple.length; i++, j++) {
        result[j] = tuple[i]
    }
    return result as Tuple<T, LowerDim<D>>
}