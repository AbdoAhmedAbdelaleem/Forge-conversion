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
exports.Downloader = void 0;
const path = __importStar(require("path"));
const fse = __importStar(require("fs-extra"));
const forge_server_utils_1 = require("forge-server-utils");
const client_1 = require("./client");
const hashes_1 = require("./hashes");
class Downloader {
    constructor(auth) {
        this.auth = auth;
        this.modelDerivativeClient = new forge_server_utils_1.ModelDerivativeClient(this.auth);
    }
    download(urn, options) {
        const context = {
            log: (options === null || options === void 0 ? void 0 : options.log) || ((message) => { }),
            cancelled: false,
            otgClient: new client_1.Client(this.auth),
            sharedClient: new client_1.SharedClient(this.auth),
            outputDir: (options === null || options === void 0 ? void 0 : options.outputDir) || '.',
            urnDir: '',
            guidDir: '',
            viewDataPath: '',
            failOnMissingAssets: !!(options === null || options === void 0 ? void 0 : options.failOnMissingAssets)
        };
        return {
            ready: this._download(urn, context),
            cancel: () => { context.cancelled = true; }
        };
    }
    async _download(urn, context) {
        let token = '';
        if ('token' in this.auth) {
            token = this.auth.token;
        }
        else {
            const authClient = new forge_server_utils_1.AuthenticationClient(this.auth.client_id, this.auth.client_secret);
            const result = await authClient.authenticate(['viewables:read', 'data:read']);
            token = result.access_token;
        }
        context.otgClient = new client_1.Client({ token });
        context.sharedClient = new client_1.SharedClient({ token });
        context.log(`Downloading derivative ${urn}`);
        const derivativeManifest = await context.otgClient.getManifest(urn);
        const otgViewable = derivativeManifest.children.find((child) => child.otg_manifest);
        if (otgViewable) {
            context.urnDir = path.join(context.outputDir, urn);
            context.guidDir = path.join(context.urnDir, otgViewable.guid);
            fse.ensureDirSync(context.guidDir);
            const helper = new client_1.ManifestHelper(otgViewable.otg_manifest);
            for (const view of helper.listViews()) {
                if (context.cancelled) {
                    return;
                }
                await this._downloadView(urn, view, context);
            }
        }
    }
    async _downloadView(urn, view, context) {
        context.log(`Downloading view ${view.urn}`);
        const resolvedUrn = view.resolvedUrn;
        const viewData = await context.otgClient.getAsset(urn, resolvedUrn);
        context.viewDataPath = path.join(context.guidDir, view.urn);
        fse.ensureDirSync(path.dirname(context.viewDataPath));
        fse.writeFileSync(context.viewDataPath, viewData);
        const otgViewHelper = new client_1.ViewHelper(JSON.parse(viewData.toString()), resolvedUrn);
        const privateModelAssets = otgViewHelper.listPrivateModelAssets();
        if (privateModelAssets) {
            if (privateModelAssets.fragments) {
                if (context.cancelled) {
                    return;
                }
                await this._downloadFragments(urn, otgViewHelper, privateModelAssets, context);
            }
            if (privateModelAssets.geometry_ptrs) {
                if (context.cancelled) {
                    return;
                }
                await this._downloadGeometries(urn, otgViewHelper, privateModelAssets, context);
            }
            if (privateModelAssets.materials_ptrs) {
                if (context.cancelled) {
                    return;
                }
                await this._downloadMaterials(urn, otgViewHelper, privateModelAssets, context);
            }
        }
    }
    async _downloadFragments(urn, otgViewHelper, privateModelAssets, context) {
        try {
            const fragmentData = await context.otgClient.getAsset(urn, privateModelAssets.fragments.resolvedUrn);
            const fragmentPath = path.join(path.dirname(context.viewDataPath), privateModelAssets.fragments.uri);
            fse.ensureDirSync(path.dirname(fragmentPath));
            fse.writeFileSync(fragmentPath, fragmentData);
        }
        catch (err) {
            if (context.failOnMissingAssets) {
                throw err;
            }
            else {
                context.log(`Could not download fragment list`);
            }
        }
    }
    async _downloadGeometries(urn, otgViewHelper, privateModelAssets, context) {
        try {
            const geometryData = await context.otgClient.getAsset(urn, privateModelAssets.geometry_ptrs.resolvedUrn);
            const geometryPath = path.join(path.dirname(context.viewDataPath), privateModelAssets.geometry_ptrs.uri);
            fse.ensureDirSync(path.dirname(geometryPath));
            fse.writeFileSync(geometryPath, geometryData);
            for (const hash of (0, hashes_1.parseHashes)(geometryData)) {
                if (context.cancelled) {
                    return;
                }
                await this._downloadGeometry(urn, hash, otgViewHelper, context);
            }
        }
        catch (err) {
            if (context.failOnMissingAssets) {
                throw err;
            }
            else {
                context.log(`Could not download geometry hashes`);
            }
        }
    }
    async _downloadGeometry(urn, hash, otgViewHelper, context) {
        try {
            const geometryUrn = otgViewHelper.getGeometryUrn(hash);
            const geometryData = await context.sharedClient.getAsset(urn, geometryUrn);
            const geometryPath = path.join(context.outputDir, 'g', hash);
            fse.ensureDirSync(path.dirname(geometryPath));
            fse.writeFileSync(geometryPath, geometryData);
        }
        catch (err) {
            if (context.failOnMissingAssets) {
                throw err;
            }
            else {
                context.log(`Could not download geometry ${hash}`);
            }
        }
    }
    async _downloadMaterials(urn, otgViewHelper, privateModelAssets, context) {
        try {
            const materialsData = await context.otgClient.getAsset(urn, privateModelAssets.materials_ptrs.resolvedUrn);
            const materialsPath = path.join(path.dirname(context.viewDataPath), privateModelAssets.materials_ptrs.uri);
            fse.ensureDirSync(path.dirname(materialsPath));
            fse.writeFileSync(materialsPath, materialsData);
            for (const hash of (0, hashes_1.parseHashes)(materialsData)) {
                if (context.cancelled) {
                    return;
                }
                await this._downloadMaterial(urn, hash, otgViewHelper, context);
            }
        }
        catch (err) {
            if (context.failOnMissingAssets) {
                throw err;
            }
            else {
                context.log(`Could not download material hashes`);
            }
        }
    }
    async _downloadMaterial(urn, hash, otgViewHelper, context) {
        const materialUrn = otgViewHelper.getMaterialUrn(hash);
        try {
            const materialData = await context.sharedClient.getAsset(urn, materialUrn);
            const materialPath = path.join(context.outputDir, 'm', hash);
            fse.ensureDirSync(path.dirname(materialPath));
            fse.writeFileSync(materialPath, materialData);
            const group = JSON.parse(materialData.toString());
            const material = group.materials[group.userassets[0]];
            if (material.textures) {
                for (const key of Object.keys(material.textures)) {
                    if (context.cancelled) {
                        return;
                    }
                    await this._downloadTexture(urn, material, key, group, otgViewHelper, context);
                }
            }
        }
        catch (err) {
            if (context.failOnMissingAssets) {
                throw err;
            }
            else {
                context.log(`Could not download material ${hash}`);
            }
        }
    }
    async _downloadTexture(urn, material, key, group, otgViewHelper, context) {
        const connection = material.textures[key].connections[0];
        const texture = group.materials[connection];
        if (texture && texture.properties.uris && 'unifiedbitmap_Bitmap' in texture.properties.uris) {
            const uri = texture.properties.uris['unifiedbitmap_Bitmap'].values[0];
            const textureUrn = otgViewHelper.getTextureUrn(uri);
            try {
                const textureData = await context.sharedClient.getAsset(urn, textureUrn);
                const texturePath = path.join(context.outputDir, 't', uri);
                fse.ensureDirSync(path.dirname(texturePath));
                fse.writeFileSync(texturePath, textureData);
            }
            catch (err) {
                if (context.failOnMissingAssets) {
                    throw err;
                }
                else {
                    context.log(`Could not download texture ${uri}`);
                }
            }
        }
    }
}
exports.Downloader = Downloader;
