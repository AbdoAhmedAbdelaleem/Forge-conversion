"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reader = exports.Scene = void 0;
const forge_server_utils_1 = require("forge-server-utils");
const client_1 = require("./client");
const hashes_1 = require("./hashes");
const fragments_1 = require("./fragments");
const geometries_1 = require("./geometries");
const materials_1 = require("./materials");
const OTG = __importStar(require("./schema"));
const IMF = __importStar(require("../common/intermediate-format"));
class Scene {
    constructor(otg) {
        this.otg = otg;
    }
    getMetadata() {
        return {};
    }
    getNodeCount() {
        return this.otg.fragments.length;
    }
    getNode(id) {
        const frag = this.otg.fragments[id];
        const node = {
            kind: IMF.NodeKind.Object,
            dbid: frag.dbId,
            geometry: frag.geomId - 1,
            material: frag.materialId - 1
        };
        if (frag.transform) {
            node.transform = { kind: IMF.TransformKind.Decomposed };
            if (frag.transform.quaternion) {
                node.transform.rotation = frag.transform.quaternion;
            }
            if (frag.transform.scale) {
                node.transform.scale = frag.transform.scale;
            }
            if (frag.transform.translation) {
                node.transform.translation = frag.transform.translation;
            }
        }
        return node;
    }
    getGeometryCount() {
        return this.otg.materialHashes.length;
    }
    _parseVertexAttributes(geometry, attributeType) {
        const attr = geometry.attributes.find(attr => attr.attributeType === attributeType);
        if (attr) {
            if (attr.componentType !== OTG.ComponentType.FLOAT) {
                console.warn('Currently vertex buffers with other than float components are not supported.');
                return undefined;
            }
            const srcBuffer = geometry.buffers[attr.bufferId];
            const srcByteStride = attr.itemStride || attr.itemSize * 4;
            const srcByteOffset = attr.itemOffset;
            const count = srcBuffer.byteLength / srcByteStride;
            const dstBuffer = Buffer.alloc(count * attr.itemSize * 4);
            const dstByteStride = attr.itemSize * 4;
            for (let i = 0; i < count; i++) {
                const srcOffset = i * srcByteStride + srcByteOffset;
                srcBuffer.copy(dstBuffer, i * dstByteStride, srcOffset, srcOffset + dstByteStride);
            }
            return new Float32Array(dstBuffer.buffer);
        }
        else {
            return undefined;
        }
    }
    _parseTexCoords(geometry) {
        const attr = geometry.attributes.find(attr => attr.attributeType === OTG.AttributeType.TextureUV);
        if (attr) {
            if (attr.componentType !== OTG.ComponentType.FLOAT) {
                console.warn('Currently we can only parse tex coords using floats.');
                return undefined;
            }
            const srcBuffer = geometry.buffers[attr.bufferId];
            const srcByteStride = attr.itemStride || attr.itemSize * 4;
            const srcByteOffset = attr.itemOffset;
            const count = srcBuffer.byteLength / srcByteStride;
            const dstBuffer = Buffer.alloc(count * attr.itemSize * 4);
            const dstByteStride = attr.itemSize * 4;
            for (let i = 0; i < count; i++) {
                const srcOffset = i * srcByteStride + srcByteOffset;
                srcBuffer.copy(dstBuffer, i * dstByteStride, srcOffset, srcOffset + dstByteStride);
            }
            return new Float32Array(dstBuffer);
        }
        return undefined;
    }
    _parseNormals(geometry) {
        const attr = geometry.attributes.find(attr => attr.attributeType === OTG.AttributeType.Normal);
        if (attr) {
            if (attr.componentType !== OTG.ComponentType.SHORT_NORM && attr.componentType !== OTG.ComponentType.USHORT_NORM) {
                console.warn('Currently vertex buffers with other than float components are not supported.');
                return undefined;
            }
            const srcBuffer = geometry.buffers[attr.bufferId];
            const srcByteStride = attr.itemStride || attr.itemSize * 2;
            const srcByteOffset = attr.itemOffset;
            const count = srcBuffer.byteLength / srcByteStride;
            const dstBuffer = Buffer.alloc(count * attr.itemSize * 2);
            const dstByteStride = attr.itemSize * 2;
            for (let i = 0; i < count; i++) {
                const srcOffset = i * srcByteStride + srcByteOffset;
                srcBuffer.copy(dstBuffer, i * dstByteStride, srcOffset, srcOffset + dstByteStride);
            }
            const packedNormals = attr.componentType === OTG.ComponentType.USHORT_NORM
                ? new Uint16Array(dstBuffer.buffer)
                : new Int16Array(dstBuffer.buffer);
            let normals = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                let packedX = packedNormals[i * 2];
                let packedY = packedNormals[i * 2 + 1];
                if (attr.componentType === OTG.ComponentType.USHORT_NORM) {
                    packedX = packedX / 32768.0 - 1.0;
                    packedY = packedY / 32768.0 - 1.0;
                }
                else {
                    packedX = packedX / 32768.0;
                    packedY = packedY / 32768.0;
                }
                const sinTheta = Math.sin(packedX * Math.PI);
                const cosTheta = Math.cos(packedX * Math.PI);
                const sinPhi = Math.sqrt(1.0 - packedY * packedY);
                const cosPhi = packedY;
                normals[i * 3] = cosTheta * sinPhi;
                normals[i * 3 + 1] = sinTheta * sinPhi;
                normals[i * 3 + 2] = cosPhi;
            }
            return normals;
        }
        else {
            return undefined;
        }
    }
    _parseIndices(geometry) {
        const attr = geometry.attributes.find(attr => attr.attributeType === OTG.AttributeType.Index);
        if (attr) {
            console.assert(attr.componentType === OTG.ComponentType.USHORT);
            const srcBuffer = geometry.buffers[attr.bufferId];
            const srcByteStride = attr.itemStride || attr.itemSize * 2;
            const srcByteOffset = attr.itemOffset;
            const count = srcBuffer.byteLength / srcByteStride;
            const dstBuffer = Buffer.alloc(count * attr.itemSize * 2);
            const dstByteStride = attr.itemSize * 2;
            for (let i = 0; i < count; i++) {
                const srcOffset = i * srcByteStride + srcByteOffset;
                srcBuffer.copy(dstBuffer, i * dstByteStride, srcOffset, srcOffset + dstByteStride);
            }
            return new Uint16Array(dstBuffer.buffer);
        }
        else {
            return undefined;
        }
    }
    _decodeTriangleIndices(indices) {
        if (!indices) {
            return undefined;
        }
        indices[1] += indices[0];
        indices[2] += indices[0];
        for (let i = 3, len = indices.length; i < len; i += 3) {
            indices[i] += indices[i - 3];
            indices[i + 1] += indices[i];
            indices[i + 2] += indices[i];
        }
        return indices;
    }
    _decodeLineIndices(indices) {
        if (!indices) {
            return undefined;
        }
        indices[1] += indices[0];
        for (let i = 2, len = indices.length; i < len; i += 2) {
            indices[i] += indices[i - 2];
            indices[i + 1] += indices[i];
        }
        return indices;
    }
    getGeometry(id) {
        const hash = this.otg.geometryHashes[id];
        const mesh = this.otg.geometryMap.get(hash);
        if (mesh) {
            let geom = undefined;
            switch (mesh.type) {
                case OTG.GeometryType.Lines:
                    geom = {
                        kind: IMF.GeometryKind.Lines,
                        getIndices: () => this._decodeLineIndices(this._parseIndices(mesh)),
                        getVertices: () => this._parseVertexAttributes(mesh, OTG.AttributeType.Position),
                        getColors: () => this._parseVertexAttributes(mesh, OTG.AttributeType.Color)
                    };
                    return geom;
                case OTG.GeometryType.Points:
                    geom = {
                        kind: IMF.GeometryKind.Points,
                        getVertices: () => this._parseVertexAttributes(mesh, OTG.AttributeType.Position),
                        getColors: () => this._parseVertexAttributes(mesh, OTG.AttributeType.Color)
                    };
                    return geom;
                case OTG.GeometryType.Triangles:
                    geom = {
                        kind: IMF.GeometryKind.Mesh,
                        getIndices: () => this._decodeTriangleIndices(this._parseIndices(mesh)),
                        getVertices: () => this._parseVertexAttributes(mesh, OTG.AttributeType.Position),
                        getNormals: () => this._parseNormals(mesh),
                        getUvChannelCount: () => mesh.attributes.filter(attr => attr.attributeType === OTG.AttributeType.TextureUV).length,
                        getUvs: (channel) => channel === 0 ? this._parseTexCoords(mesh) : undefined
                    };
                    return geom;
                case OTG.GeometryType.WideLines:
                    console.warn('OTG wide line geometries not supported.');
                    break;
            }
        }
        return { kind: IMF.GeometryKind.Empty };
    }
    getMaterialCount() {
        return this.otg.materialHashes.length;
    }
    getMaterial(id) {
        var _a, _b;
        const hash = this.otg.materialHashes[id];
        const _mat = this.otg.materialMap.get(hash);
        const mat = {
            kind: IMF.MaterialKind.Physical,
            diffuse: { x: 0, y: 0, z: 0 },
            metallic: (_mat === null || _mat === void 0 ? void 0 : _mat.metal) ? 1.0 : 0.0,
            opacity: (_a = _mat === null || _mat === void 0 ? void 0 : _mat.opacity) !== null && _a !== void 0 ? _a : 1.0,
            roughness: (_mat === null || _mat === void 0 ? void 0 : _mat.glossiness) ? (1.0 - _mat.glossiness / 255.0) : 1.0 // TODO: how to map glossiness to roughness properly?
        };
        if (_mat === null || _mat === void 0 ? void 0 : _mat.diffuse) {
            mat.diffuse.x = _mat.diffuse[0];
            mat.diffuse.y = _mat.diffuse[1];
            mat.diffuse.z = _mat.diffuse[2];
        }
        if ((_b = _mat === null || _mat === void 0 ? void 0 : _mat.maps) === null || _b === void 0 ? void 0 : _b.diffuse) {
            mat.maps = mat.maps || {};
            mat.maps.diffuse = _mat.maps.diffuse.uri;
        }
        return mat;
    }
    getImage(uri) {
        return undefined;
    }
}
exports.Scene = Scene;
/**
 * Experimental reader of the OTG file format (successor to SVF, with focus on geometry deduplication).
 * Missing features:
 *   - reading metadata
 *   - reading material textures
 *   - parsing line/point geometry
 */
class Reader {
    constructor(urn, manifest, client, sharedClient, options) {
        this.urn = urn;
        this.manifest = manifest;
        this.client = client;
        this.sharedClient = sharedClient;
        this.log = (options === null || options === void 0 ? void 0 : options.log) || ((msg) => { });
    }
    static async FromDerivativeService(urn, guid, auth, options) {
        urn = urn.replace(/=/g, '');
        let otgClient;
        let sharedClient;
        if ('token' in auth) {
            otgClient = new client_1.Client({ token: auth.token });
            sharedClient = new client_1.SharedClient({ token: auth.token });
        }
        else {
            const authClient = new forge_server_utils_1.AuthenticationClient(auth.client_id, auth.client_secret);
            const newAuth = await authClient.authenticate(['viewables:read', 'data:read']);
            otgClient = new client_1.Client({ token: newAuth.access_token });
            sharedClient = new client_1.SharedClient({ token: newAuth.access_token });
        }
        const manifest = await otgClient.getManifest(urn);
        const viewable = manifest.children.find((child) => child.guid === guid);
        console.assert(viewable);
        console.assert(viewable.role === 'viewable');
        console.assert('otg_manifest' in viewable);
        return new Reader(urn, viewable.otg_manifest, otgClient, sharedClient, options);
    }
    async read() {
        const otgManifestHelper = new client_1.ManifestHelper(this.manifest);
        let views = [];
        for (const view of otgManifestHelper.listViews()) {
            console.assert(view.role === 'graphics');
            console.assert(view.mime === 'application/autodesk-otg');
            views.push(await this.readView(view.id, view.resolvedUrn));
        }
        // Currently we're only interested in the 1st view
        return new Scene(views[0]);
    }
    async readView(id, resolvedUrn) {
        this.log(`Reading view ${id}`);
        let fragments = [];
        let geometryHashes = [];
        let geometryMap = new Map();
        let materialHashes = [];
        let materialMap = new Map();
        const viewData = await this.client.getAsset(this.urn, resolvedUrn);
        const otgViewHelper = new client_1.ViewHelper(JSON.parse(viewData.toString()), resolvedUrn);
        const privateModelAssets = otgViewHelper.listPrivateModelAssets();
        let tasks = [];
        if (privateModelAssets) {
            if (privateModelAssets.fragments) {
                tasks.push(this.parseFragments(privateModelAssets.fragments.resolvedUrn, fragments));
            }
            if (privateModelAssets.geometry_ptrs) {
                tasks.push(this.parseGeometries(privateModelAssets.geometry_ptrs.resolvedUrn, otgViewHelper, geometryHashes, geometryMap));
            }
            if (privateModelAssets.materials_ptrs) {
                tasks.push(this.parseMaterials(privateModelAssets.materials_ptrs.resolvedUrn, otgViewHelper, materialHashes, materialMap));
            }
        }
        await Promise.all(tasks);
        return {
            id,
            fragments,
            geometryHashes,
            geometryMap,
            materialHashes,
            materialMap
        };
    }
    async parseFragments(fragListUrn, output) {
        this.log(`Parsing fragment list`);
        const fragmentData = await this.client.getAsset(this.urn, fragListUrn);
        for (const fragment of (0, fragments_1.parseFragments)(fragmentData)) {
            output.push(fragment);
        }
        this.log(`Fragment list parsed`);
    }
    async parseGeometries(geomHashListUrn, otgViewHelper, hashes, map) {
        this.log(`Parsing geometries`);
        const assetData = await this.client.getAsset(this.urn, geomHashListUrn);
        let tasks = [];
        for (const hash of (0, hashes_1.parseHashes)(assetData)) {
            hashes.push(hash);
            tasks.push(this.parseGeometry(otgViewHelper, hash, map));
        }
        await Promise.all(tasks);
        this.log(`Geometries parsed`);
    }
    async parseGeometry(otgViewHelper, hash, map) {
        this.log(`Parsing geometry ${hash}`);
        const geometryUrn = otgViewHelper.getGeometryUrn(hash);
        const geometryData = await this.sharedClient.getAsset(this.urn, geometryUrn);
        map.set(hash, (0, geometries_1.parseGeometry)(geometryData));
    }
    async parseMaterials(matHashListUrn, otgViewHelper, hashes, map) {
        this.log(`Parsing materials`);
        const assetData = await this.client.getAsset(this.urn, matHashListUrn);
        let tasks = [];
        for (const hash of (0, hashes_1.parseHashes)(assetData)) {
            hashes.push(hash);
            tasks.push(this.parseMaterial(otgViewHelper, hash, map));
        }
        await Promise.all(tasks);
        this.log(`Materials parsed`);
    }
    async parseMaterial(otgViewHelper, hash, map) {
        this.log(`Parsing material ${hash}`);
        const materialUrn = otgViewHelper.getMaterialUrn(hash);
        const materialData = await this.sharedClient.getAsset(this.urn, materialUrn);
        map.set(hash, (0, materials_1.parseMaterial)(materialData.toString()));
    }
}
exports.Reader = Reader;
