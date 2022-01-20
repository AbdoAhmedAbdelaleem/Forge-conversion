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
exports.SharedClient = exports.Client = exports.ViewHelper = exports.ManifestHelper = void 0;
const path = __importStar(require("path"));
const common_1 = require("forge-server-utils/dist/common");
const ApiHost = 'https://otg.autodesk.com';
const RootPath = 'modeldata';
const ReadTokenScopes = ['bucket:read', 'data:read'];
const WriteTokenScopes = ['data:write'];
class ManifestHelper {
    constructor(manifest) {
        this.manifest = manifest;
        console.assert(manifest.version === 1);
        console.assert(manifest.progress === 'complete');
        console.assert(manifest.status === 'success');
    }
    get sharedRoot() { return this.manifest.paths.shared_root; }
    listViews() {
        const versionRoot = this.manifest.paths.version_root;
        return Object.entries(this.manifest.views).map(([id, view]) => {
            return {
                id,
                role: view.role,
                mime: view.mime,
                urn: view.urn,
                resolvedUrn: path.normalize(path.join(versionRoot, view.urn))
            };
        });
    }
    listSharedDatabaseAssets() {
        const pdbManifest = this.manifest.pdb_manifest;
        const sharedRoot = this.manifest.paths.shared_root;
        return pdbManifest.assets.filter((asset) => asset.isShared).map((asset) => {
            return {
                tag: asset.tag,
                type: asset.type,
                uri: asset.uri,
                resolvedUrn: path.normalize(path.join(sharedRoot, pdbManifest.pdb_shared_rel_path, asset.uri))
            };
        });
    }
}
exports.ManifestHelper = ManifestHelper;
class ViewHelper {
    constructor(view, resolvedViewUrn) {
        this.view = view;
        this.resolvedViewUrn = resolvedViewUrn;
    }
    listPrivateModelAssets() {
        const assets = this.view.manifest && this.view.manifest.assets;
        if (assets) {
            let result = {};
            if (assets.fragments) {
                result.fragments = {
                    uri: assets.fragments,
                    resolvedUrn: this.resolveAssetUrn(assets.fragments)
                };
            }
            if (assets.fragments_extra) {
                result.fragments_extra = {
                    uri: assets.fragments_extra,
                    resolvedUrn: this.resolveAssetUrn(assets.fragments_extra)
                };
            }
            if (assets.materials_ptrs) {
                result.materials_ptrs = {
                    uri: assets.materials_ptrs,
                    resolvedUrn: this.resolveAssetUrn(assets.materials_ptrs)
                };
            }
            if (assets.geometry_ptrs) {
                result.geometry_ptrs = {
                    uri: assets.geometry_ptrs,
                    resolvedUrn: this.resolveAssetUrn(assets.geometry_ptrs)
                };
            }
            return result;
        }
        else {
            return undefined;
        }
    }
    listSharedModelAssets() {
        const assets = this.view.manifest && this.view.manifest.shared_assets;
        if (assets) {
            let result = {};
            if (assets.geometry) {
                result.geometry = {
                    uri: assets.geometry,
                    resolvedUrn: this.resolveAssetUrn(assets.geometry)
                };
            }
            if (assets.materials) {
                result.materials = {
                    uri: assets.materials,
                    resolvedUrn: this.resolveAssetUrn(assets.materials)
                };
            }
            if (assets.textures) {
                result.textures = {
                    uri: assets.textures,
                    resolvedUrn: this.resolveAssetUrn(assets.textures)
                };
            }
            return result;
        }
        else {
            return undefined;
        }
    }
    listPrivateDatabaseAssets() {
        const pdb = this.view.manifest && this.view.manifest.assets && this.view.manifest.assets.pdb;
        if (pdb) {
            return {
                avs: {
                    uri: pdb.avs,
                    resolvedUrn: this.resolveAssetUrn(pdb.avs)
                },
                offsets: {
                    uri: pdb.offsets,
                    resolvedUrn: this.resolveAssetUrn(pdb.offsets)
                },
                dbid: {
                    uri: pdb.dbid,
                    resolvedUrn: this.resolveAssetUrn(pdb.dbid)
                }
            };
        }
        else {
            return undefined;
        }
    }
    listSharedDatabaseAssets() {
        const pdb = this.view.manifest && this.view.manifest.shared_assets && this.view.manifest.shared_assets.pdb;
        if (pdb) {
            return {
                attrs: {
                    uri: pdb.attrs,
                    resolvedUrn: this.resolveAssetUrn(pdb.attrs)
                },
                values: {
                    uri: pdb.values,
                    resolvedUrn: this.resolveAssetUrn(pdb.values)
                },
                ids: {
                    uri: pdb.ids,
                    resolvedUrn: this.resolveAssetUrn(pdb.ids)
                }
            };
        }
        else {
            return undefined;
        }
    }
    resolveAssetUrn(assetUrn) {
        if (assetUrn.startsWith('urn:')) {
            return assetUrn;
        }
        else {
            return path.normalize(path.join(path.dirname(this.resolvedViewUrn), assetUrn));
        }
    }
    getGeometryUrn(hash) {
        return this.view.manifest.shared_assets.geometry + hash;
    }
    getMaterialUrn(hash) {
        return this.view.manifest.shared_assets.materials + hash;
    }
    getTextureUrn(hash) {
        return this.view.manifest.shared_assets.textures + hash;
    }
}
exports.ViewHelper = ViewHelper;
/**
 * Client for the OTG service (https://otg.autodesk.com).
 */
class Client extends common_1.ForgeClient {
    /**
     * Initializes the client with specific authentication and host address.
     * @param {IAuthOptions} auth Authentication object,
     * containing either `client_id` and `client_secret` properties (for 2-legged authentication),
     * or a single `token` property (for 2-legged or 3-legged authentication with pre-generated access token).
     * @param {string} [host="https://otg.autodesk.com"] OTG service host.
     */
    constructor(auth, host = ApiHost) {
        super(RootPath, auth, host);
        this.axios.defaults.headers = this.axios.defaults.headers || {};
        this.axios.defaults.headers['Pragma'] = 'no-cache';
    }
    /**
     * Triggers processing of OTG derivatives for a specific model.
     * Note: the model must already be processed into SVF using the Model Derivative service.
     * @async
     * @param {string} urn Model Derivative model URN.
     * @param {string} [account] Optional account ID.
     * @param {boolean} [force] Optional flag to force the translation.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async createDerivatives(urn, account, force) {
        const params = { urn };
        if (account) {
            params['account_id'] = account;
        }
        if (force) {
            params['force_conversion'] = force;
        }
        return this.post(``, params, {}, WriteTokenScopes);
    }
    /**
     * Removes OTG derivatives for a specific model.
     * @async
     * @param {string} urn Model Derivative model URN.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async deleteDerivatives(urn) {
        return this.delete(urn, {}, WriteTokenScopes);
    }
    /**
     * Retrieves the Model Derivative manifest augmented with OTG information.
     * @async
     * @param {string} urn Model Derivative model URN.
     * @returns {Promise<any>} Model Derivative manifest augmented with OTG information.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getManifest(urn) {
        return this.get(`manifest/${urn}`, {}, ReadTokenScopes);
    }
    /**
     * Retrieves raw data of specific OTG asset.
     * @async
     * @param {string} urn Model Derivative model URN.
     * @param {string} assetUrn OTG asset URN, typically composed from OTG "version root" or "shared root",
     * path to OTG view JSON, etc.
     * @returns {Promise<Buffer>} Asset data.
     * @throws Error when the request fails, for example, due to insufficient rights, or incorrect scopes.
     */
    async getAsset(urn, assetUrn) {
        return this.getBuffer(`file/${assetUrn}?acmsession=${urn}`, {}, ReadTokenScopes);
    }
}
exports.Client = Client;
class SharedClient extends common_1.ForgeClient {
    constructor(auth, host = ApiHost) {
        super('cdn', auth, host);
        this.sharding = 4;
        this.axios.defaults.headers = this.axios.defaults.headers || {};
        this.axios.defaults.headers['Pragma'] = 'no-cache';
    }
    async getAsset(urn, assetUrn) {
        const assetUrnTokens = assetUrn.split('/');
        const account = assetUrnTokens[1];
        const assetType = assetUrnTokens[2];
        const assetHash = assetUrnTokens[3];
        const cdnUrn = `${assetHash.substr(0, 4)}/${account}/${assetType}/${assetHash.substr(4)}`;
        return this.getBuffer(cdnUrn + `?acmsession=${urn}`, {}, ReadTokenScopes);
    }
}
exports.SharedClient = SharedClient;
