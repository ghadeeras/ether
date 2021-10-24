
import * as wa from "../../../vibrato.js/latest/js/wa.js"
import * as rt from "../../../vibrato.js/latest/js/rt.js"
import { vec4, Vec4 } from "./vector.js"

export type ScalarFieldExports = {
    tessellateTetrahedron: (contourValue: number, point0: rt.Reference, point1: rt.Reference, point2: rt.Reference, point3: rt.Reference) => rt.Reference;
    tessellateCube: (contourValue: number, point0: rt.Reference, point1: rt.Reference, point2: rt.Reference, point3: rt.Reference, point4: rt.Reference, point5: rt.Reference, point6: rt.Reference, point7: rt.Reference) => rt.Reference;
    tesselateScalarField(fieldRef: rt.Reference, resolution: number, contourValue: number): rt.Reference;
}

export const modulePaths = {
    mem: "vibrato.js/latest/wa/mem.wasm",
    space: "vibrato.js/latest/wa/space.wasm",
    scalarField: "ether/latest/wa/scalarField.wasm",
}

export type ScalarFieldModuleNames = keyof typeof modulePaths
export type ScalarFieldModules = wa.WebAssemblyModules<ScalarFieldModuleNames>

export async function loadScalarFieldModule(): Promise<ScalarFieldModule> {
    const modules = await wa.webLoadModules("", modulePaths)
    return new ScalarFieldModuleImpl(modules)
}

export type ScalarFieldSampler = (x: number, y: number, z: number, w?: number) => Vec4

export interface ScalarFieldModule {

    readonly modules: ScalarFieldModules

    newInstance(): ScalarFieldInstance

}

export interface ScalarFieldInstance {

    readonly mem: rt.MemExports
    readonly space: rt.SpaceExports
    readonly scalarField: ScalarFieldExports

    readonly vertices: Float32Array;

    resolution: number
    sampler: ScalarFieldSampler
    contourValue: number

    get(x: number, y: number, z: number): Vec4

}

class ScalarFieldModuleImpl implements ScalarFieldModule {

    private linker: wa.Linker<ScalarFieldModuleNames>

    constructor(readonly modules: ScalarFieldModules) {
        this.linker = new wa.Linker(modules)
    }

    newInstance(): ScalarFieldInstance {
        const instances = this.linker.link({})
        return new ScalarFieldInstanceImpl(
            instances.mem.exports as rt.MemExports, 
            instances.space.exports as rt.SpaceExports, 
            instances.scalarField.exports as ScalarFieldExports
        )
    }
    
}

class ScalarFieldInstanceImpl implements ScalarFieldInstance {

    private fieldRef: number = 0
    private length: number = 0
    
    private samplingDirty: boolean = false
    private verticesDirty: boolean = false

    private _vertices: Float32Array = new Float32Array([])

    private _contourValue: number = 0
    private _resolution: number = 1
    private _sampler: ScalarFieldSampler = (x, y, z) => vec4.of(x, y, z, (x*x + y*y + z*z) / 2)

    constructor(readonly mem: rt.MemExports, readonly space: rt.SpaceExports, readonly scalarField: ScalarFieldExports) {
        this.mem.enter()
        this.mem.enter()
        this.invalidateSampling()
    }
    
    get resolution(): number {
        return this._resolution
    }

    set resolution(r: number) {
        this._resolution = r
        this.invalidateSampling()
    }

    get sampler(): ScalarFieldSampler {
        return this._sampler
    }

    set sampler(s: ScalarFieldSampler) {
        this._sampler = s
        this.invalidateSampling()
    }

    get contourValue(): number {
        return this._contourValue
    }

    set contourValue(r: number) {
        this._contourValue = r
        this.invalidateVertices()
    }

    get vertices(): Float32Array {
        this.doTesselate()
        return this._vertices
    }

    get(x: number, y: number, z: number): Vec4 {
        x = this.denormalize(x)
        y = this.denormalize(y)
        z = this.denormalize(z)

        const x0 = Math.floor(x)
        const dx0 = x - x0
        const x1 = Math.ceil(x)
        const dx1 = x1 - x

        const y0 = Math.floor(y)
        const dy0 = y - y0
        const y1 = Math.ceil(y)
        const dy1 = y1 - y

        const z0 = Math.floor(z)
        const dz0 = z - z0
        const z1 = Math.ceil(z)
        const dz1 = z1 - z

        const dx0dy0 = dx0 * dy0
        const dx0dy1 = dx0 * dy1
        const dx1dy0 = dx1 * dy0
        const dx1dy1 = dx1 * dy1

        const w000 = 1 - dx0dy0 * dz0
        const w001 = 1 - dx0dy0 * dz1
        const w010 = 1 - dx0dy1 * dz0
        const w011 = 1 - dx0dy1 * dz1
        const w100 = 1 - dx1dy0 * dz0
        const w101 = 1 - dx1dy0 * dz1
        const w110 = 1 - dx1dy1 * dz0
        const w111 = 1 - dx1dy1 * dz1
        const w = w000 + w001 + w010 + w011 + w100 + w101 + w110 + w111

        const r = (this._resolution + 1)

        const r100 = 8
        const r010 = r * r100
        const r001 = r * r010

        const r011 = r010 + r001
        const r101 = r100 + r001
        const r110 = r100 + r010

        const r000 = 0
        const r111 = r101 + r010

        const offset = (z0 * r + y0) * r + x0 + 4

        const field = new Float64Array(this.mem.stack.buffer, this.fieldRef, this.length)
        return vec4.addAll(
            vec4.scale(this.getSample(field, offset + r000), w000 / w),
            vec4.scale(this.getSample(field, offset + r001), w001 / w),
            vec4.scale(this.getSample(field, offset + r010), w010 / w),
            vec4.scale(this.getSample(field, offset + r011), w011 / w),
            vec4.scale(this.getSample(field, offset + r100), w100 / w),
            vec4.scale(this.getSample(field, offset + r101), w101 / w),
            vec4.scale(this.getSample(field, offset + r110), w110 / w),
            vec4.scale(this.getSample(field, offset + r111), w111 / w),
        )
    }

    private getSample(field: Float64Array, offset: number) {
        return vec4.of(field[offset], field[offset + 1], field[offset + 2], field[offset + 3])
    }

    private invalidateSampling() {
        if (this.samplingDirty) {
            return
        }

        this.invalidateVertices()

        this.mem.leave()
        this.samplingDirty = true
    }

    private invalidateVertices() {
        if (this.verticesDirty) {
            return
        }

        this.mem.leave()
        this.verticesDirty = true
    }

    private doTesselate() {
        this.doSample()
        if (!this.verticesDirty) {
            return
        }
        this.mem.enter()
        const start = this.scalarField.tesselateScalarField(this.fieldRef, this._resolution, this._contourValue)
        const end = this.mem.allocate32(0)
        this._vertices = new Float32Array(this.mem.stack.buffer, start, (end - start) / Float32Array.BYTES_PER_ELEMENT)
        this.verticesDirty = false
    }

    private doSample() {
        if (!this.samplingDirty) {
            return
        }
        this.mem.enter()
        this.length = ((this._resolution + 1) ** 3) * 2 * 4
        this.fieldRef = this.mem.allocate64(this.length)
        const viewF64 = new Float64Array(this.mem.stack.buffer)
        let i = this.fieldRef / Float64Array.BYTES_PER_ELEMENT
        for (let z = 0; z <= this._resolution; z++) {
            for (let y = 0; y <= this._resolution; y++) {
                for (let x = 0; x <= this._resolution; x++) {
                    const pos = vec4.of(this.normalize(x), this.normalize(y), this.normalize(z), 1)
                    const field = this._sampler(...pos)
                    viewF64.set(pos, i)
                    i += pos.length
                    viewF64.set(field, i)
                    i += field.length
                }
            }
        }
        this.samplingDirty = false
    }

    private normalize(x: number): number {
        return 2 * (x / this._resolution) - 1
    }

    private denormalize(x: number): number {
        return this._resolution * (this.wrap(x) + 1) / 2
    }

    private wrap(x: number) {
        return x > 1 ?
            x % 1 - 1 :
            x < -1 ?
                x % 1 + 1 :
                x
    }

} 