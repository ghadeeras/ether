import { Mat4 } from "./matrix.js";

const EPSILON = 2.0 ** -20

export class PerspectiveProjection {

    private _matrix: Mat4
    private _inverseMatrix: Mat4

    constructor(
        readonly near: number,
        readonly far: number | null = null,
        readonly reversedZ: boolean = false,
        readonly legacy: boolean = false,
    ) {
        [this._matrix, this._inverseMatrix] = far === null
            ? reversedZ
                ? legacy
                    ? this.infinite(near, EPSILON - 2, EPSILON - 1)
                    : this.infinite(near, EPSILON - 1, EPSILON)
                : legacy
                    ? this.infinite(near, 2 - EPSILON, 1 - EPSILON)
                    : this.infinite(near, 1 - EPSILON, 1 - EPSILON)
            : reversedZ
                ? legacy
                    ? this.finite(far, near, far + near, 2 * far * near)
                    : this.finite(far, near,       near,     far * near)
                : legacy
                    ? this.finite(near, far, near + far, 2 * near * far)
                    : this.finite(near, far,        far,     near * far)
    }

    matrices(focalLength: number, aspectRatio: number): [Mat4, Mat4] {
        const [scaleX, scaleY] = aspectRatio > 1.0 
            ? [focalLength / aspectRatio, focalLength]
            : [focalLength, focalLength * aspectRatio]
        return [
            projectionMatrix(    scaleX,     scaleY,        this._matrix),
            projectionMatrix(1 / scaleX, 1 / scaleY, this._inverseMatrix)
        ]
    }

    matrix(focalLength: number, aspectRatio: number): Mat4 {
        const [scaleX, scaleY] = aspectRatio > 1.0 
            ? [focalLength / aspectRatio, focalLength]
            : [focalLength, focalLength * aspectRatio]
        return projectionMatrix(scaleX, scaleY, this._matrix)
    }

    inverseMatrix(focalLength: number, aspectRatio: number): Mat4 {
        const scale = 1 / focalLength;
        const [scaleX, scaleY] = aspectRatio > 1.0 
            ? [scale * aspectRatio, scale]
            : [scale, scale / aspectRatio]
        return projectionMatrix(scaleX, scaleY, this._inverseMatrix)
    }

    private infinite(near: number, limit1: number, limit2: number): [Mat4, Mat4] {
        const prod = near * limit1
        return [
            [
                [1, 0,       0,             0],
                [0, 1,       0,             0],
                [0, 0, -limit2,            -1],
                [0, 0,   -prod,             0]
            ],
            [
                [1, 0,       0,             0],
                [0, 1,       0,             0],
                [0, 0,       0,    -1  / prod],
                [0, 0,      -1, limit2 / prod]
            ]
        ];
    }

    private finite(near: number, far: number, sum: number, prod: number): [Mat4, Mat4] {
        const range = far - near
        return [
            [
                [1, 0,             0,             0],
                [0, 1,             0,             0],
                [0, 0,  -sum / range,            -1],
                [0, 0, -prod / range,             0]
            ],
            [
                [1, 0,             0,             0],
                [0, 1,             0,             0],
                [0, 0,             0, -range / prod],
                [0, 0,            -1,    sum / prod]
            ]
        ];
    }

}

function projectionMatrix(scaleX: number, scaleY: number, perspective: Mat4): Mat4 {
    return [
        [scaleX, 0,  0,  0],
        [0, scaleY,  0,  0],
        [...perspective[2]],
        [...perspective[3]],
    ];
}
