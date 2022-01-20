"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGeometry = void 0;
const input_stream_1 = require("../common/input-stream");
function parseGeometry(buffer) {
    const stream = new input_stream_1.InputStream(buffer);
    const magic = stream.getString(4);
    console.assert(magic === 'OTG0');
    const flags = stream.getUint16();
    const geomType = flags & 0x03;
    const buffCount = stream.getUint8();
    const attrCount = stream.getUint8();
    let buffOffsets = [0];
    for (let i = 1; i < buffCount; i++) {
        buffOffsets.push(stream.getUint32());
    }
    let attributes = [];
    for (let i = 0; i < attrCount; i++) {
        attributes.push(parseGeometryAttribute(stream));
    }
    let dataOffset = stream.offset;
    if (dataOffset % 4 !== 0) {
        dataOffset += 4 - (dataOffset % 4);
    }
    let buffers = [];
    for (let i = 0; i < buffCount; i++) {
        const offset = dataOffset + buffOffsets[i];
        const length = (i + 1 < buffCount) ? buffOffsets[i + 1] - buffOffsets[i] : buffer.length - offset;
        const buff = Buffer.alloc(length);
        buffer.copy(buff, 0, offset, offset + length);
        buffers.push(buff);
    }
    return {
        type: geomType,
        attributes,
        buffers
    };
}
exports.parseGeometry = parseGeometry;
function parseGeometryAttribute(stream) {
    const attributeType = stream.getUint8();
    const b = stream.getUint8();
    const itemSize = b & 0x0f;
    const componentType = (b >> 4) & 0x0f;
    const itemOffset = stream.getUint8(); // offset in bytes
    const itemStride = stream.getUint8(); // stride in bytes
    const bufferId = stream.getUint8();
    return {
        attributeType,
        componentType,
        itemSize,
        itemOffset,
        itemStride,
        bufferId
    };
}
