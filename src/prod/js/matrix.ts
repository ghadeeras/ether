import * as vec from "./vector.js"

export type Mat<D extends vec.Dim> = vec.Tuple<vec.Vec<D>, D>

export interface MatMath<D extends vec.Dim> {

    gen(...columns: [() => vec.Vec<D>] | vec.Tuple<() => vec.Vec<D>, D>): () => Mat<D>

    identity(): Mat<D>

    diagonal(...d: vec.Vec<D>): Mat<D>

    outer(v1: vec.Vec<D>, v2: vec.Vec<D>): Mat<D>

    projectionOn(v: vec.Vec<D>): Mat<D>

    apply(m: Mat<D>, v: vec.Vec<D>): vec.Vec<D>

    neg(m: Mat<D>): Mat<D>

    scale(m: Mat<D>, f: number): Mat<D>

    add(m1: Mat<D>, m2: Mat<D>): Mat<D>

    sub(m1: Mat<D>, m2: Mat<D>): Mat<D>

    mul(m1: Mat<D>, m2: Mat<D>): Mat<D>

    determinant(m: Mat<D>): number

    transpose(m: Mat<D>): Mat<D>

    inverse(m: Mat<D>): Mat<D>

    columnMajorArray(m: Mat<D>): number[]

}

export class Mat4Math implements MatMath<4> {

    gen(...columns: [() => vec.Vec<4>] | vec.Tuple<() => vec.Vec<4>, 4>): () => Mat<4> {
        const column = columns[0]
        return columns.length == 1 ?
            () => [column(), column(), column(), column()] :
            () => [columns[0](), columns[1](), columns[2](), columns[3]()]
    }

    identity(): Mat<4> {
        return this.diagonal(1, 1, 1, 1)
    }

    diagonal(...d: vec.Vec<4>): Mat<4> {
        return [
            [d[0],    0,    0,    0],
            [   0, d[1],    0,    0],
            [   0,    0, d[2],    0],
            [   0,    0,    0, d[3]]
        ]
    }

    outer(v1: vec.Vec<4>, v2: vec.Vec<4>): Mat<4> {
        return [
            vec.vec4.scale(v1, v2[0]),
            vec.vec4.scale(v1, v2[1]),
            vec.vec4.scale(v1, v2[2]),
            vec.vec4.scale(v1, v2[3])
        ]
    }

    projectionOn(v: vec.Vec<4>): Mat<4> {
        return this.scale(this.outer(v, v), 1 / vec.vec4.lengthSquared(v))
    }

    scalingAlong(v: vec.Vec<3>, parallel: number = 1, perpendicular: number = 1): Mat<4> {
        return this.cast(mat3.scalingAlong(v, parallel, perpendicular))
    }

    scaling(...diagonal: vec.Vec<3>): Mat<4> {
        return this.diagonal(...diagonal, 1)
    }

    translation(t: vec.Vec<3>): Mat<4> {
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [   ...t, 1]
        ]
    }

    rotationX(angle: number): Mat<4> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [1,    0,    0, 0],
            [0, +cos, +sin, 0],
            [0, -sin, +cos, 0],
            [0,    0,    0, 1]
        ]
    }

    rotationY(angle: number): Mat<4> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [+cos, 0, -sin, 0],
            [   0, 1,    0, 0],
            [+sin, 0, +cos, 0],
            [   0, 0,    0, 1]
        ]
    }

    rotationZ(angle: number): Mat<4> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [+cos, +sin, 0, 0],
            [-sin, +cos, 0, 0],
            [   0,    0, 1, 0],
            [   0,    0, 0, 1]
        ]
    }

    rotation(angle: number, axis: vec.Vec<3>): Mat<4> {
        return this.cast(mat3.rotation(angle, axis))
    }

    crossProdRotation(v1: vec.Vec<3>, v2: vec.Vec<3>, power: number = 1): Mat<4> {
        return this.cast(mat3.crossProdRotation(v1, v2, power))
    }

    lookTowards(pos: vec.Vec<3>, dir: vec.Vec<3> = [0, 0, -1], up: vec.Vec<3> = [0, 1, 0]): Mat<4> {
        const r = mat3.lookTowards(dir, up)
        const p = mat3.apply(r, vec.vec3.neg(pos))
        return this.affine(r, p)
    }

    lookAt(pos: vec.Vec<3>, objPos: vec.Vec<3> = [0, 0, 0], up: vec.Vec<3> = [0, 1, 0]) {
        const dir = vec.vec3.sub(objPos, pos);
        return this.lookTowards(pos, dir, up);
    }
    
    projection(zoom: number = 1, near: number = 1, far: number = 128 * near, aspectRatio = 1): Mat<4> {
        const range = far - near
        return [
            [zoom / aspectRatio,    0,                        0,  0],
            [                 0, zoom,                        0,  0],
            [                 0,    0,    -(near + far) / range, -1],
            [                 0,    0, -2 * near * far  / range,  0]
        ];
    }

    translated(m: Mat<3>, t: vec.Vec<3>): Mat<4> {
        const newT = vec.vec3.sub(t, mat3.apply(m, t))
        return this.affine(m, newT)
    }

    affine(m: Mat<3>, t: vec.Vec<3>): Mat<4> {
        return [
            [...m[0], 0],
            [...m[1], 0],
            [...m[2], 0],
            [   ...t, 1]
        ]
    }

    cast(m: Mat<2> | Mat<3>): Mat<4> {
        return m.length == 2 ? [
            [...m[0], 0, 0],
            [...m[1], 0, 0],
            [0,    0, 1, 0],
            [0,    0, 0, 1],
        ] : [
            [...m[0], 0],
            [...m[1], 0],
            [...m[2], 0],
            [0, 0, 0, 1]
        ]
    }

    apply(m: Mat<4>, v: vec.Vec<4>): vec.Vec<4> {
        return vec.vec4.addAll(
            vec.vec4.scale(m[0], v[0]),
            vec.vec4.scale(m[1], v[1]),
            vec.vec4.scale(m[2], v[2]),
            vec.vec4.scale(m[3], v[3])
        )
    }

    neg(m: Mat<4>): Mat<4> {
        return [
            vec.vec4.neg(m[0]),
            vec.vec4.neg(m[1]),
            vec.vec4.neg(m[2]),
            vec.vec4.neg(m[3])
        ]
    }

    scale(m: Mat<4>, f: number): Mat<4> {
        return [
            vec.vec4.scale(m[0], f),
            vec.vec4.scale(m[1], f),
            vec.vec4.scale(m[2], f),
            vec.vec4.scale(m[3], f)
        ]
    }

    add(m1: Mat<4>, m2: Mat<4>): Mat<4> {
        return [
            vec.vec4.add(m1[0], m2[0]),
            vec.vec4.add(m1[1], m2[1]),
            vec.vec4.add(m1[2], m2[2]),
            vec.vec4.add(m1[3], m2[3])
        ]
    }

    sub(m1: Mat<4>, m2: Mat<4>): Mat<4> {
        return [
            vec.vec4.sub(m1[0], m2[0]),
            vec.vec4.sub(m1[1], m2[1]),
            vec.vec4.sub(m1[2], m2[2]),
            vec.vec4.sub(m1[3], m2[3])
        ]
    }

    mul(m1: Mat<4>, m2: Mat<4>): Mat<4> {
        return [
            this.apply(m1, m2[0]),
            this.apply(m1, m2[1]),
            this.apply(m1, m2[2]),
            this.apply(m1, m2[3])
        ]
    }

    determinant(m: Mat<4>): number {
        const col0 = m[0]
        return (
            col0[0] * this.minor(m, 0, 0) -
            col0[1] * this.minor(m, 0, 1) +
            col0[2] * this.minor(m, 0, 2) -
            col0[3] * this.minor(m, 0, 3)
        ) 
    }

    transpose(m: Mat<4>): Mat<4> {
        return [
            [m[0][0], m[1][0], m[2][0], m[3][0]],
            [m[0][1], m[1][1], m[2][1], m[3][1]],
            [m[0][2], m[1][2], m[2][2], m[3][2]],
            [m[0][3], m[1][3], m[2][3], m[3][3]]
        ]
    }

    inverse(m: Mat<4>): Mat<4> {
        const min00 = this.minor(m, 0, 0)
        const min01 = this.minor(m, 0, 1)
        const min02 = this.minor(m, 0, 2)
        const min03 = this.minor(m, 0, 3)
        const col0 = m[0]
        const det = (
            col0[0] * min00 -
            col0[1] * min01 +
            col0[2] * min02 -
            col0[3] * min03
        )
        return this.scale([
            [+min00, -this.minor(m, 1, 0), +this.minor(m, 2, 0), -this.minor(m, 3, 0)],
            [-min01, +this.minor(m, 1, 1), -this.minor(m, 2, 1), +this.minor(m, 3, 1)],
            [+min02, -this.minor(m, 1, 2), +this.minor(m, 2, 2), -this.minor(m, 3, 2)],
            [-min03, +this.minor(m, 1, 3), -this.minor(m, 2, 3), +this.minor(m, 3, 3)]
        ], 1 / det)
    }

    columnMajorArray(m: Mat<4>): number[] {
        return [
            ...m[0],
            ...m[1],
            ...m[2],
            ...m[3]
        ]
    }

    private minor(m: Mat<4>, col: vec.Component<4>, row: vec.Component<4>): number {
        return mat3.determinant(this.subMat(m, col, row))
    }

    private subMat(m: Mat<4>, col: vec.Component<4>, row: vec.Component<4>): Mat<3> {
        const m3x4: vec.Tuple<vec.Vec<4>, 3> = vec.deleteComponent<vec.Vec<4>, 4>(m, col)
        return [
            vec.deleteComponent<number, 4>(m3x4[0], row),
            vec.deleteComponent<number, 4>(m3x4[1], row),
            vec.deleteComponent<number, 4>(m3x4[2], row)
        ]
    }

}

export class Mat3Math implements MatMath<3> {

    gen(...columns: [() => vec.Vec<3>] | vec.Tuple<() => vec.Vec<3>, 3>): () => Mat<3> {
        const column = columns[0]
        return columns.length == 1 ?
            () => [column(), column(), column()] :
            () => [columns[0](), columns[1](), columns[2]()]
    }

    identity(): Mat<3> {
        return this.diagonal(1, 1, 1)
    }

    diagonal(...d: vec.Vec<3>): Mat<3> {
        return [
            [d[0],    0,    0],
            [   0, d[1],    0],
            [   0,    0, d[2]]
        ]
    }

    outer(v1: vec.Vec<3>, v2: vec.Vec<3>): Mat<3> {
        return [
            vec.vec3.scale(v1, v2[0]),
            vec.vec3.scale(v1, v2[1]),
            vec.vec3.scale(v1, v2[2])
        ]
    }

    projectionOn(v: vec.Vec<3>): Mat<3> {
        return this.scale(this.outer(v, v), 1 / vec.vec3.lengthSquared(v))
    }

    scalingAlong(v: vec.Vec<3>, parallel: number = 1, perpendicular: number = 1): Mat<3> {
        if (parallel === perpendicular) {
            return this.diagonal(parallel, parallel, parallel)
        }
        const parallelProj = this.projectionOn(v)
        const perpendicularProj = this.sub(this.identity(), this.projectionOn(v))
        return this.add(
            parallel === 1 ? parallelProj : this.scale(parallelProj, parallel),
            perpendicular === 1 ? perpendicularProj : this.scale(perpendicularProj, perpendicular)
        )
    }

    scaling(...diagonal: vec.Vec<3>): Mat<3> {
        return this.diagonal(...diagonal)
    }

    rotationX(angle: number): Mat<3> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [1,    0,    0],
            [0, +cos, +sin],
            [0, -sin, +cos]
        ]
    }

    rotationY(angle: number): Mat<3> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [+cos, 0, -sin],
            [   0, 1,    0],
            [+sin, 0, +cos]
        ]
    }

    rotationZ(angle: number): Mat<3> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [+cos, +sin, 0],
            [-sin, +cos, 0],
            [   0,    0, 1]
        ]
    }

    rotation(angle: number, axis: vec.Vec<3>): Mat<3> {
        const unitAxis = vec.vec3.unit(axis)
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        return this.rotMat(cos, sin, ...unitAxis)
    }

    crossProdRotation(v1: vec.Vec<3>, v2: vec.Vec<3>, power: number = 1): Mat<3> {
        const u1 = vec.vec3.unit(v1)
        const u2 = vec.vec3.unit(v2)
        const axis = vec.vec3.cross(u1, u2)
        const cos = vec.vec3.dot(u1, u2)
        const sin = vec.vec3.length(axis)
        if (power === 1) {
            const unitAxis = vec.vec3.scale(axis, 1 / sin)
            return this.rotMat(cos, sin, ...unitAxis)
        } else {
            const newAngle = power * Math.atan2(sin, cos)
            return this.rotation(newAngle, axis)
        }
    }

    private rotMat(cos: number, sin: number, x: number, y: number, z: number): Mat<3> {
        if (Number.isNaN(cos + sin + x + y + z)) {
            return this.identity()
        }
        const oneMinusCos = 1 - cos
        const x1 = x * oneMinusCos
        const y1 = y * oneMinusCos
        const z1 = z * oneMinusCos
        const xx = x * x1
        const yy = y * y1
        const zz = z * z1
        const xy = x * y1
        const yz = y * z1
        const zx = z * x1
        return [
            [xx + cos, xy + z * sin, zx - y * sin],
            [xy - z * sin, yy + cos, yz + x * sin],
            [zx + y * sin, yz - x * sin, zz + cos]
        ]
    }


    lookTowards(dir: vec.Vec<3>, up: vec.Vec<3> = [0, 1, 0]): Mat<3> {
        const z = vec.vec3.unit(vec.vec3.neg(dir))
        const x = vec.vec3.unit(vec.vec3.cross(up, z))
        const y = vec.vec3.cross(z, x)
        return this.transpose([x, y, z])
    }

    cast(m: Mat<2>): Mat<3> {
        return [
            [...m[0], 0],
            [...m[1], 0],
            [0,    0, 1]
        ]
    }

    apply(m: Mat<3>, v: vec.Vec<3>): vec.Vec<3> {
        return vec.vec3.addAll(
            vec.vec3.scale(m[0], v[0]),
            vec.vec3.scale(m[1], v[1]),
            vec.vec3.scale(m[2], v[2])
        )
    }

    neg(m: Mat<3>): Mat<3> {
        return [
            vec.vec3.neg(m[0]),
            vec.vec3.neg(m[1]),
            vec.vec3.neg(m[2])
        ]
    }

    scale(m: Mat<3>, f: number): Mat<3> {
        return [
            vec.vec3.scale(m[0], f),
            vec.vec3.scale(m[1], f),
            vec.vec3.scale(m[2], f)
        ]
    }

    add(m1: Mat<3>, m2: Mat<3>): Mat<3> {
        return [
            vec.vec3.add(m1[0], m2[0]),
            vec.vec3.add(m1[1], m2[1]),
            vec.vec3.add(m1[2], m2[2])
        ]
    }

    sub(m1: Mat<3>, m2: Mat<3>): Mat<3> {
        return [
            vec.vec3.sub(m1[0], m2[0]),
            vec.vec3.sub(m1[1], m2[1]),
            vec.vec3.sub(m1[2], m2[2])
        ]
    }

    mul(m1: Mat<3>, m2: Mat<3>): Mat<3> {
        return [
            this.apply(m1, m2[0]),
            this.apply(m1, m2[1]),
            this.apply(m1, m2[2])
        ]
    }

    determinant(m: Mat<3>): number {
        return vec.vec3.dot(vec.vec3.cross(m[0], m[1]), m[2])
    }

    transpose(m: Mat<3>): Mat<3> {
        return [
            [m[0][0], m[1][0], m[2][0]],
            [m[0][1], m[1][1], m[2][1]],
            [m[0][2], m[1][2], m[2][2]]
        ]
    }

    inverse(m: Mat<3>): Mat<3> {
        const v1x2 = vec.vec3.cross(m[1], m[2])
        const v2x0 = vec.vec3.cross(m[2], m[0])
        const v0x1 = vec.vec3.cross(m[0], m[1])
        const det = vec.vec3.dot(v0x1, m[2])
        return this.scale(this.transpose([v1x2, v2x0, v0x1]), 1 / det)
    }

    columnMajorArray(m: Mat<3>): number[] {
        return [
            ...m[0],
            ...m[1],
            ...m[2]
        ]
    }

}

export class Mat2Math implements MatMath<2> {

    gen(...columns: [() => vec.Vec<2>] | vec.Tuple<() => vec.Vec<2>, 2>): () => Mat<2> {
        const column = columns[0]
        return columns.length == 1 ?
            () => [column(), column()] :
            () => [columns[0](), columns[1]()]
    }

    identity(): Mat<2> {
        return this.diagonal(1, 1)
    }

    diagonal(...d: vec.Vec<2>): Mat<2> {
        return [
            [d[0],    0],
            [   0, d[1]]
        ]
    }

    outer(v1: vec.Vec<2>, v2: vec.Vec<2>): Mat<2> {
        return [
            vec.vec2.scale(v1, v2[0]),
            vec.vec2.scale(v1, v2[1])
        ]
    }

    projectionOn(v: vec.Vec<2>): Mat<2> {
        return this.scale(this.outer(v, v), 1 / vec.vec2.lengthSquared(v))
    }

    scalingAlong(v: vec.Vec<2>, parallel: number = 1, perpendicular: number = 1): Mat<2> {
        if (parallel === perpendicular) {
            return this.diagonal(parallel, parallel)
        }
        const parallelProj = this.projectionOn(v)
        const perpendicularProj = this.sub(this.identity(), this.projectionOn(v))
        return this.add(
            parallel === 1 ? parallelProj : this.scale(parallelProj, parallel),
            perpendicular === 1 ? perpendicularProj : this.scale(perpendicularProj, perpendicular)
        )
    }

    scaling(...diagonal: vec.Vec<2>): Mat<2> {
        return this.diagonal(...diagonal)
    }

    rotation(angle: number): Mat<2> {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            [+cos, +sin],
            [-sin, +cos]
        ]
    }

    apply(m: Mat<2>, v: vec.Vec<2>): vec.Vec<2> {
        return vec.vec2.add(
            vec.vec2.scale(m[0], v[0]),
            vec.vec2.scale(m[1], v[1])
        )
    }

    neg(m: Mat<2>): Mat<2> {
        return [
            vec.vec2.neg(m[0]),
            vec.vec2.neg(m[1])
        ]
    }

    scale(m: Mat<2>, f: number): Mat<2> {
        return [
            vec.vec2.scale(m[0], f),
            vec.vec2.scale(m[1], f)
        ]
    }

    add(m1: Mat<2>, m2: Mat<2>): Mat<2> {
        return [
            vec.vec2.add(m1[0], m2[0]),
            vec.vec2.add(m1[1], m2[1])
        ]
    }

    sub(m1: Mat<2>, m2: Mat<2>): Mat<2> {
        return [
            vec.vec2.sub(m1[0], m2[0]),
            vec.vec2.sub(m1[1], m2[1])
        ]
    }

    mul(m1: Mat<2>, m2: Mat<2>): Mat<2> {
        return [
            this.apply(m1, m2[0]),
            this.apply(m1, m2[1])
        ]
    }

    determinant(m: Mat<2>): number {
        return vec.vec2.cross(m[0], m[1])
    }

    transpose(m: Mat<2>): Mat<2> {
        return [
            [m[0][0], m[1][0]],
            [m[0][1], m[1][1]]
        ]
    }

    inverse(m: Mat<2>): Mat<2> {
        return this.scale(
            [
                [+m[1][1], -m[0][1]],
                [-m[1][0], +m[0][0]],
            ], 
            1 / this.determinant(m)
        )
    }

    columnMajorArray(m: Mat<2>): number[] {
        return [
            ...m[0],
            ...m[1]
        ]
    }

}

export function coordinateSystem<D extends vec.Dim>(math: MatMath<D>, s: Mat<D>): (m: Mat<D>) => Mat<D> {
    const invS = math.inverse(s)
    return m => math.mul(s, math.mul(m, invS))
}

export const mat4 = new Mat4Math()
export const mat3 = new Mat3Math()
export const mat2 = new Mat2Math()
