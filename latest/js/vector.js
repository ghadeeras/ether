class VecMathBase {
    of(...components) {
        return components;
    }
    lengthSquared(v) {
        return this.dot(v, v);
    }
    length(v) {
        return Math.sqrt(this.lengthSquared(v));
    }
    setLength(v, l) {
        return this.scale(v, l / this.length(v));
    }
    unit(v) {
        return this.setLength(v, 1);
    }
    mix(w, v1, v2) {
        return this.add(this.scale(v1, w), this.scale(v2, 1 - w));
    }
    weightedSum(w1, v1, w2, v2) {
        return this.scale(this.add(this.scale(v1, w1), this.scale(v2, w2)), 1 / (w1 + w2));
    }
    angle(v1, v2) {
        const l1 = this.lengthSquared(v1);
        const l2 = this.lengthSquared(v2);
        const dot = this.dot(v1, v2);
        const cos2 = (dot * dot) / (l1 * l2);
        const cos2x = 2 * cos2 - 1;
        const x = Math.acos(cos2x) / 2;
        return x;
    }
}
export class ImmutableVecMathBase extends VecMathBase {
    addAll(v, ...vs) {
        return this.mutable.addAll([...v], ...vs);
    }
    subAll(v, ...vs) {
        return this.mutable.subAll([...v], ...vs);
    }
    maxAll(v, ...vs) {
        return this.mutable.maxAll([...v], ...vs);
    }
    minAll(v, ...vs) {
        return this.mutable.minAll([...v], ...vs);
    }
    project(v1, v2) {
        return this.scale(v2, this.dot(v1, v2) / this.lengthSquared(v2));
    }
    reject(v1, v2) {
        return this.sub(v1, this.project(v1, v2));
    }
}
export class ImmutableVec4Math extends ImmutableVecMathBase {
    get mutable() {
        return mutVec4;
    }
    get immutable() {
        return this;
    }
    from(array, offset = 0) {
        return [array[offset + 0], array[offset + 1], array[offset + 2], array[offset + 3]];
    }
    gen(...components) {
        const component = components[0];
        return components.length == 1 ?
            () => this.of(component(), component(), component(), component()) :
            () => this.of(components[0](), components[1](), components[2](), components[3]());
    }
    add(v1, v2) {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1],
            v1[2] + v2[2],
            v1[3] + v2[3]
        ];
    }
    sub(v1, v2) {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1],
            v1[2] - v2[2],
            v1[3] - v2[3]
        ];
    }
    mul(v1, v2) {
        return [
            v1[0] * v2[0],
            v1[1] * v2[1],
            v1[2] * v2[2],
            v1[3] * v2[3]
        ];
    }
    div(v1, v2) {
        return [
            v1[0] / v2[0],
            v1[1] / v2[1],
            v1[2] / v2[2],
            v1[3] / v2[3]
        ];
    }
    scale(v, f) {
        return [
            v[0] * f,
            v[1] * f,
            v[2] * f,
            v[3] * f
        ];
    }
    max(v1, v2) {
        return [
            Math.max(v1[0], v2[0]),
            Math.max(v1[1], v2[1]),
            Math.max(v1[2], v2[2]),
            Math.max(v1[3], v2[3])
        ];
    }
    min(v1, v2) {
        return [
            Math.min(v1[0], v2[0]),
            Math.min(v1[1], v2[1]),
            Math.min(v1[2], v2[2]),
            Math.min(v1[3], v2[3])
        ];
    }
    neg(v) {
        return [
            -v[0],
            -v[1],
            -v[2],
            -v[3]
        ];
    }
    swizzle(v, ...components) {
        var _a, _b, _c, _d;
        return [
            (_a = v[components[0]]) !== null && _a !== void 0 ? _a : failure(""),
            (_b = v[components[1]]) !== null && _b !== void 0 ? _b : failure(""),
            (_c = v[components[2]]) !== null && _c !== void 0 ? _c : failure(""),
            (_d = v[components[3]]) !== null && _d !== void 0 ? _d : failure(""),
        ];
    }
    dot(v1, v2) {
        return (v1[0] * v2[0] +
            v1[1] * v2[1] +
            v1[2] * v2[2] +
            v1[3] * v2[3]);
    }
    prod(v, m) {
        return [
            this.dot(v, m[0]),
            this.dot(v, m[1]),
            this.dot(v, m[2]),
            this.dot(v, m[3])
        ];
    }
}
export class ImmutableVec3Math extends ImmutableVecMathBase {
    get mutable() {
        return mutVec3;
    }
    get immutable() {
        return this;
    }
    from(array, offset = 0) {
        return [array[offset + 0], array[offset + 1], array[offset + 2]];
    }
    gen(...components) {
        const component = components[0];
        return components.length == 1 ?
            () => this.of(component(), component(), component()) :
            () => this.of(components[0](), components[1](), components[2]());
    }
    add(v1, v2) {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1],
            v1[2] + v2[2]
        ];
    }
    sub(v1, v2) {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1],
            v1[2] - v2[2]
        ];
    }
    mul(v1, v2) {
        return [
            v1[0] * v2[0],
            v1[1] * v2[1],
            v1[2] * v2[2]
        ];
    }
    div(v1, v2) {
        return [
            v1[0] / v2[0],
            v1[1] / v2[1],
            v1[2] / v2[2]
        ];
    }
    scale(v, f) {
        return [
            v[0] * f,
            v[1] * f,
            v[2] * f
        ];
    }
    max(v1, v2) {
        return [
            Math.max(v1[0], v2[0]),
            Math.max(v1[1], v2[1]),
            Math.max(v1[2], v2[2])
        ];
    }
    min(v1, v2) {
        return [
            Math.min(v1[0], v2[0]),
            Math.min(v1[1], v2[1]),
            Math.min(v1[2], v2[2])
        ];
    }
    neg(v) {
        return [
            -v[0],
            -v[1],
            -v[2]
        ];
    }
    swizzle(v, ...components) {
        var _a, _b, _c;
        return [
            (_a = v[components[0]]) !== null && _a !== void 0 ? _a : failure(""),
            (_b = v[components[1]]) !== null && _b !== void 0 ? _b : failure(""),
            (_c = v[components[2]]) !== null && _c !== void 0 ? _c : failure("")
        ];
    }
    dot(v1, v2) {
        return (v1[0] * v2[0] +
            v1[1] * v2[1] +
            v1[2] * v2[2]);
    }
    cross(v1, v2) {
        return [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0]
        ];
    }
    prod(v, m) {
        return [
            this.dot(v, m[0]),
            this.dot(v, m[1]),
            this.dot(v, m[2])
        ];
    }
    equal(v1, v2, precision = 0.001) {
        const cross = this.length(this.cross(v1, v2));
        const dot = this.dot(v1, v2);
        const tan = cross / dot;
        return tan < precision && tan > -precision;
    }
}
export class ImmutableVec2Math extends ImmutableVecMathBase {
    get mutable() {
        return mutVec2;
    }
    get immutable() {
        return this;
    }
    from(array, offset = 0) {
        return [array[offset + 0], array[offset + 1]];
    }
    gen(...components) {
        const component = components[0];
        return components.length == 1 ?
            () => this.of(component(), component()) :
            () => this.of(components[0](), components[1]());
    }
    add(v1, v2) {
        return [
            v1[0] + v2[0],
            v1[1] + v2[1]
        ];
    }
    sub(v1, v2) {
        return [
            v1[0] - v2[0],
            v1[1] - v2[1]
        ];
    }
    mul(v1, v2) {
        return [
            v1[0] * v2[0],
            v1[1] * v2[1]
        ];
    }
    div(v1, v2) {
        return [
            v1[0] / v2[0],
            v1[1] / v2[1]
        ];
    }
    scale(v, f) {
        return [
            v[0] * f,
            v[1] * f
        ];
    }
    max(v1, v2) {
        return [
            Math.max(v1[0], v2[0]),
            Math.max(v1[1], v2[1])
        ];
    }
    min(v1, v2) {
        return [
            Math.min(v1[0], v2[0]),
            Math.min(v1[1], v2[1])
        ];
    }
    neg(v) {
        return [
            -v[0],
            -v[1]
        ];
    }
    swizzle(v, ...components) {
        var _a, _b;
        return [
            (_a = v[components[0]]) !== null && _a !== void 0 ? _a : failure(""),
            (_b = v[components[1]]) !== null && _b !== void 0 ? _b : failure("")
        ];
    }
    dot(v1, v2) {
        return (v1[0] * v2[0] +
            v1[1] * v2[1]);
    }
    prod(v, m) {
        return [
            this.dot(v, m[0]),
            this.dot(v, m[1])
        ];
    }
    cross(v1, v2) {
        return (v1[0] * v2[1] -
            v1[1] * v2[0]);
    }
    equal(v1, v2, precision = 0.001) {
        const cross = this.cross(v1, v2);
        const dot = this.dot(v1, v2);
        const tan = cross / dot;
        return tan < precision && tan > -precision;
    }
}
export class MutableVecMathBase extends VecMathBase {
    from(array, offset = 0) {
        return this.immutable.from(array, offset);
    }
    addAll(v, ...vs) {
        for (const vn of vs) {
            this.add(v, vn);
        }
        return v;
    }
    subAll(v, ...vs) {
        for (const vn of vs) {
            this.sub(v, vn);
        }
        return v;
    }
    maxAll(v, ...vs) {
        for (const vn of vs) {
            this.max(v, vn);
        }
        return v;
    }
    minAll(v, ...vs) {
        for (const vn of vs) {
            this.min(v, vn);
        }
        return v;
    }
    gen(...components) {
        return this.immutable.gen(...components);
    }
    swizzle(v, ...components) {
        return this.immutable.swizzle(v, ...components);
    }
    dot(v1, v2) {
        return this.immutable.dot(v1, v2);
    }
    prod(v, m) {
        return this.immutable.prod(v, m);
    }
    project(v1, v2) {
        return this.immutable.project(v1, v2);
    }
    reject(v1, v2) {
        return this.immutable.reject(v1, v2);
    }
}
export class MutableVec4Math extends MutableVecMathBase {
    get mutable() {
        return this;
    }
    get immutable() {
        return vec4;
    }
    add(v1, v2) {
        v1[0] += v2[0];
        v1[1] += v2[1];
        v1[2] += v2[2];
        v1[3] += v2[3];
        return v1;
    }
    sub(v1, v2) {
        v1[0] -= v2[0];
        v1[1] -= v2[1];
        v1[2] -= v2[2];
        v1[3] -= v2[3];
        return v1;
    }
    mul(v1, v2) {
        v1[0] *= v2[0];
        v1[1] *= v2[1];
        v1[2] *= v2[2];
        v1[3] *= v2[3];
        return v1;
    }
    div(v1, v2) {
        v1[0] /= v2[0];
        v1[1] /= v2[1];
        v1[2] /= v2[2];
        v1[3] /= v2[3];
        return v1;
    }
    scale(v, f) {
        v[0] *= f;
        v[1] *= f;
        v[2] *= f;
        v[3] *= f;
        return v;
    }
    max(v1, v2) {
        v1[0] = Math.max(v1[0], v2[0]);
        v1[1] = Math.max(v1[1], v2[1]);
        v1[2] = Math.max(v1[2], v2[2]);
        v1[3] = Math.max(v1[3], v2[3]);
        return v1;
    }
    min(v1, v2) {
        v1[0] = Math.min(v1[0], v2[0]);
        v1[1] = Math.min(v1[1], v2[1]);
        v1[2] = Math.min(v1[2], v2[2]);
        v1[3] = Math.min(v1[3], v2[3]);
        return v1;
    }
    neg(v) {
        v[0] = -v[0];
        v[1] = -v[1];
        v[2] = -v[2];
        v[3] = -v[3];
        return v;
    }
}
export class MutableVec3Math extends MutableVecMathBase {
    get mutable() {
        return this;
    }
    get immutable() {
        return vec3;
    }
    add(v1, v2) {
        v1[0] += v2[0];
        v1[1] += v2[1];
        v1[2] += v2[2];
        return v1;
    }
    sub(v1, v2) {
        v1[0] -= v2[0];
        v1[1] -= v2[1];
        v1[2] -= v2[2];
        return v1;
    }
    mul(v1, v2) {
        v1[0] *= v2[0];
        v1[1] *= v2[1];
        v1[2] *= v2[2];
        return v1;
    }
    div(v1, v2) {
        v1[0] /= v2[0];
        v1[1] /= v2[1];
        v1[2] /= v2[2];
        return v1;
    }
    scale(v, f) {
        v[0] *= f;
        v[1] *= f;
        v[2] *= f;
        return v;
    }
    max(v1, v2) {
        v1[0] = Math.max(v1[0], v2[0]);
        v1[1] = Math.max(v1[1], v2[1]);
        v1[2] = Math.max(v1[2], v2[2]);
        return v1;
    }
    min(v1, v2) {
        v1[0] = Math.min(v1[0], v2[0]);
        v1[1] = Math.min(v1[1], v2[1]);
        v1[2] = Math.min(v1[2], v2[2]);
        return v1;
    }
    neg(v) {
        v[0] = -v[0];
        v[1] = -v[1];
        v[2] = -v[2];
        return v;
    }
}
export class MutableVec2Math extends MutableVecMathBase {
    get mutable() {
        return this;
    }
    get immutable() {
        return vec2;
    }
    add(v1, v2) {
        v1[0] += v2[0];
        v1[1] += v2[1];
        return v1;
    }
    sub(v1, v2) {
        v1[0] -= v2[0];
        v1[1] -= v2[1];
        return v1;
    }
    mul(v1, v2) {
        v1[0] *= v2[0];
        v1[1] *= v2[1];
        return v1;
    }
    div(v1, v2) {
        v1[0] /= v2[0];
        v1[1] /= v2[1];
        return v1;
    }
    scale(v, f) {
        v[0] *= f;
        v[1] *= f;
        return v;
    }
    max(v1, v2) {
        v1[0] = Math.max(v1[0], v2[0]);
        v1[1] = Math.max(v1[1], v2[1]);
        return v1;
    }
    min(v1, v2) {
        v1[0] = Math.min(v1[0], v2[0]);
        v1[1] = Math.min(v1[1], v2[1]);
        return v1;
    }
    neg(v) {
        v[0] = -v[0];
        v[1] = -v[1];
        return v;
    }
}
export const vec2 = new ImmutableVec2Math();
export const vec3 = new ImmutableVec3Math();
export const vec4 = new ImmutableVec4Math();
export const mutVec2 = new MutableVec2Math();
export const mutVec3 = new MutableVec3Math();
export const mutVec4 = new MutableVec4Math();
export function deleteComponent(tuple, component) {
    const result = new Array(tuple.length - 1);
    for (let i = 0, j = 0; i < component; i++, j++) {
        result[j] = tuple[i];
    }
    for (let i = component + 1, j = component; i < tuple.length; i++, j++) {
        result[j] = tuple[i];
    }
    return result;
}
function failure(message) {
    throw new Error(message);
}
