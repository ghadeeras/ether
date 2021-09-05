import { Mat } from "./matrix.js";
import { Vec, vec3, vec4 } from "./vector.js";

export type Quat = Vec<4>

export class QuatMath {

    add(q1: Quat, q2: Quat): Quat {
        return vec4.add(q1, q2)
    }

    sub(q1: Quat, q2: Quat): Quat {
        return vec4.sub(q1, q2)
    }

    mul(q1: Quat, q2: Quat): Quat {
        const [x1, y1, z1, w1] = q1
        const [x2, y2, z2, w2] = q2
        return [
            y1 * z2 - y2 * z1 + x1 * w2 + x2 * w1,
            z1 * x2 - z2 * x1 + y1 * w2 + y2 * w1,
            x1 * y2 - x2 * y1 + z1 * w2 + z2 * w1,
            w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
        ]
    }

    scale(q: Quat, s: number): Quat {
        return vec4.scale(q, s)
    }

    neg(q: Quat): Quat {
        return vec4.neg(q)
    }

    conj(q: Quat): Quat {
        return [-q[0], -q[1], -q[2], q[3]]
    }

    unit(q: Quat): Quat {
        return vec4.unit(q)
    }

    inverse(q: Quat): Quat {
        return this.scale(this.conj(q), 1 / this.lengthSquared(q))
    }

    lengthSquared(q: Quat): number {
        return vec4.lengthSquared(q)
    }

    length(q: Quat): number {
        return vec4.length(q)
    }

    rotation(angle: number, axis: Vec<3>, isNormalized: boolean = false): Quat {
        const a = angle / 2
        const unitAxis = isNormalized ? axis : vec3.unit(axis);
        return [...vec3.scale(unitAxis, Math.sin(a)), Math.cos(a)]
    }

    transform(q: Quat, v: Vec<3>, isNormalized: boolean = false): Vec<3> {
        const [qx, qy, qz, c] = isNormalized ? q : this.unit(q)
        const sa: Vec<3> = [qx, qy, qz]
        const ss = vec3.lengthSquared(sa)
        return vec3.addAll(
            vec3.scale(v, c * c - ss),
            vec3.scale(sa, 2 * vec3.dot(sa, v)),
            vec3.scale(vec3.cross(sa, v), 2 * c)
        )
    }

    toMatrix(q: Quat, isNormalized: boolean = false): Mat<3> {
        const [x, y, z, w] = isNormalized ? q : this.unit(q)
        const xx = x * x
        const yy = y * y
        const zz = z * z
        const xy = x * y
        const yz = y * z
        const zx = z * x
        const wx = w * x
        const wy = w * y
        const wz = w * z
        return [
            [1 - 2 * (yy + zz),     2 * (xy + wz),     2 * (zx - wy)],
            [    2 * (xy - wz), 1 - 2 * (zz + xx),     2 * (yz + wx)],
            [    2 * (zx + wy),     2 * (yz - wx), 1 - 2 * (xx + yy)]
        ]
    }

}

export const quat = new QuatMath()