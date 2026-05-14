import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync, existsSync } from "fs";

// CRC32 puro Node.js (necessário para PNG válido)
function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// Gera um PNG sólido com um coração branco simples no centro
function createPNG(size, bgR, bgG, bgB) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Desenha coração branco simples no centro
  const pixels = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      pixels[idx] = bgR;
      pixels[idx + 1] = bgG;
      pixels[idx + 2] = bgB;
    }
  }

  // Coração usando fórmula matemática: (x²+y²-1)³ - x²y³ ≤ 0
  const cx = size / 2;
  const cy = size * 0.52;
  const scale = size * 0.32;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const nx = (px - cx) / scale;
      const ny = -(py - cy) / scale;
      const val = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
      if (val <= 0) {
        const idx = (py * size + px) * 3;
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
      }
    }
  }

  // Montar dados de imagem com filtro None (0) por linha
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3;
      row[1 + x * 3] = pixels[src];
      row[2 + x * 3] = pixels[src + 1];
      row[3 + x * 3] = pixels[src + 2];
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = deflateSync(rawData, { level: 6 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Pink: #ec4899 = rgb(236, 72, 153)
const R = 236, G = 72, B = 153;

if (!existsSync("./public/icons")) mkdirSync("./public/icons", { recursive: true });

writeFileSync("./public/icons/icon-192.png", createPNG(192, R, G, B));
writeFileSync("./public/icons/icon-512.png", createPNG(512, R, G, B));
writeFileSync("./public/apple-touch-icon.png", createPNG(180, R, G, B));

// favicon.ico: navegadores modernos aceitam PNG renomeado como .ico
writeFileSync("./public/favicon.ico", createPNG(32, R, G, B));

console.log("✓ Ícones gerados em public/icons/ e public/");
