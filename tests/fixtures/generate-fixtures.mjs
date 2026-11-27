import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const body = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([length, body, crc]);
}

function png(width, height) {
  const pixels = Buffer.alloc(width * height * 4, 0);
  const set = (x, y, r, g, b, a = 255) => {
    const index = (y * width + x) * 4;
    pixels[index] = r; pixels[index + 1] = g; pixels[index + 2] = b; pixels[index + 3] = a;
  };
  set(0, 0, 255, 0, 0); set(width - 1, 0, 0, 255, 0); set(0, height - 1, 0, 0, 255); set(width - 1, height - 1, 255, 255, 0);
  set(Math.floor(width / 3), Math.floor(height / 2), 40, 60, 80, 128);
  set(Math.floor(width * 2 / 3), Math.floor(height / 2), 200, 100, 50, 0);
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    scanlines[y * (width * 4 + 1)] = 0;
    pixels.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0))]);
}

await mkdir('public/fixtures', { recursive: true });
await writeFile('public/fixtures/roundtrip-4x3.png', png(4, 3));
await writeFile('public/fixtures/roundtrip-2048x1024.png', png(2048, 1024));
