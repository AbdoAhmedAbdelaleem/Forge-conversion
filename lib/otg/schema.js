"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentType = exports.AttributeType = exports.GeometryType = void 0;
var GeometryType;
(function (GeometryType) {
    GeometryType[GeometryType["Triangles"] = 0] = "Triangles";
    GeometryType[GeometryType["Lines"] = 1] = "Lines";
    GeometryType[GeometryType["Points"] = 2] = "Points";
    GeometryType[GeometryType["WideLines"] = 3] = "WideLines";
})(GeometryType = exports.GeometryType || (exports.GeometryType = {}));
var AttributeType;
(function (AttributeType) {
    AttributeType[AttributeType["Index"] = 0] = "Index";
    AttributeType[AttributeType["IndexEdges"] = 1] = "IndexEdges";
    AttributeType[AttributeType["Position"] = 2] = "Position";
    AttributeType[AttributeType["Normal"] = 3] = "Normal";
    AttributeType[AttributeType["TextureUV"] = 4] = "TextureUV";
    AttributeType[AttributeType["Color"] = 5] = "Color";
})(AttributeType = exports.AttributeType || (exports.AttributeType = {}));
var ComponentType;
(function (ComponentType) {
    ComponentType[ComponentType["BYTE"] = 0] = "BYTE";
    ComponentType[ComponentType["SHORT"] = 1] = "SHORT";
    ComponentType[ComponentType["UBYTE"] = 2] = "UBYTE";
    ComponentType[ComponentType["USHORT"] = 3] = "USHORT";
    ComponentType[ComponentType["BYTE_NORM"] = 4] = "BYTE_NORM";
    ComponentType[ComponentType["SHORT_NORM"] = 5] = "SHORT_NORM";
    ComponentType[ComponentType["UBYTE_NORM"] = 6] = "UBYTE_NORM";
    ComponentType[ComponentType["USHORT_NORM"] = 7] = "USHORT_NORM";
    ComponentType[ComponentType["FLOAT"] = 8] = "FLOAT";
    ComponentType[ComponentType["INT"] = 9] = "INT";
    ComponentType[ComponentType["UINT"] = 10] = "UINT";
    //DOUBLE = 11
})(ComponentType = exports.ComponentType || (exports.ComponentType = {}));
