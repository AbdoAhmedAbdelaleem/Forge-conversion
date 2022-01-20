"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseHashes = void 0;
const input_stream_1 = require("../common/input-stream");
function* parseHashes(buffer) {
    const stream = new input_stream_1.InputStream(buffer);
    const hashSize = stream.getUint16();
    console.assert(hashSize % 4 === 0);
    const version = stream.getUint16();
    const count = stream.getUint16();
    for (let i = 1; i <= count; i++) {
        yield buffer.toString('hex', i * hashSize, (i + 1) * hashSize);
    }
}
exports.parseHashes = parseHashes;
