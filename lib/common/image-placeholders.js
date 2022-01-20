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
exports.ImagePlaceholder = void 0;
const path = __importStar(require("path"));
const fse = __importStar(require("fs-extra"));
const ResFolder = path.join(__dirname, '..', '..', 'res');
class ImagePlaceholder {
    constructor() { }
    static get JPG() {
        if (!this._jpg) {
            this._jpg = fse.readFileSync(path.join(ResFolder, 'placeholder.jpg'));
        }
        return this._jpg;
    }
    static get PNG() {
        if (!this._png) {
            this._png = fse.readFileSync(path.join(ResFolder, 'placeholder.png'));
        }
        return this._png;
    }
    static get BMP() {
        if (!this._bmp) {
            this._bmp = fse.readFileSync(path.join(ResFolder, 'placeholder.bmp'));
        }
        return this._bmp;
    }
    static get GIF() {
        if (!this._gif) {
            this._gif = fse.readFileSync(path.join(ResFolder, 'placeholder.gif'));
        }
        return this._gif;
    }
}
exports.ImagePlaceholder = ImagePlaceholder;