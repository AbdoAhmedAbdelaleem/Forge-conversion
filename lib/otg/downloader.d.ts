import { ModelDerivativeClient } from 'forge-server-utils';
import { IAuthOptions } from 'forge-server-utils/dist/common';
export interface IDownloadOptions {
    outputDir?: string;
    log?: (message: string) => void;
    failOnMissingAssets?: boolean;
}
export interface IDownloadTask {
    ready: Promise<void>;
    cancel: () => void;
}
export declare class Downloader {
    protected auth: IAuthOptions;
    protected modelDerivativeClient: ModelDerivativeClient;
    constructor(auth: IAuthOptions);
    download(urn: string, options?: IDownloadOptions): IDownloadTask;
    private _download;
    private _downloadView;
    private _downloadFragments;
    private _downloadGeometries;
    private _downloadGeometry;
    private _downloadMaterials;
    private _downloadMaterial;
    private _downloadTexture;
}
//# sourceMappingURL=downloader.d.ts.map