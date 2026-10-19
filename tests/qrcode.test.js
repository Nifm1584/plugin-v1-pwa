'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const jsQR = require('jsqr');

const QRCODE_PATH = process.env.QRCODE_PATH
  || path.resolve(__dirname, '..', 'dashboard', 'dist', 'qrcode.js');
const qrcode = require(QRCODE_PATH);

const CASES = [
  {
    name: 'curta, versão 1 sem padrão de alinhamento',
    version: 1,
    errorCorrectionLevel: 'L',
    maxBytes: 17,
    url: 'https://treg.co'
  },
  {
    name: 'média, versão 5 com padrão de alinhamento',
    version: 5,
    errorCorrectionLevel: 'M',
    maxBytes: 84,
    url: 'https://treg-pwa.example.com/treg?session=abc123&agent=default&lang=pt-BR'
  },
  {
    name: 'longa, versão 10 com múltiplos padrões de alinhamento',
    version: 10,
    errorCorrectionLevel: 'M',
    maxBytes: 213,
    url: 'https://treg-pwa.example.com/api/plugins/treg-pwa/?session=xyz789&agent=default&lang=pt-BR&timestamp=1234567890&signature=abcdef1234567890abcdef1234567890abcdef12'
  }
];

function renderQrToRgba(qr, scale = 8, margin = 4) {
  const moduleCount = qr.getModuleCount();
  const size = (moduleCount + margin * 2) * scale;
  const pixels = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const row = Math.floor(y / scale) - margin;
      const col = Math.floor(x / scale) - margin;
      const inside = row >= 0 && row < moduleCount && col >= 0 && col < moduleCount;
      const dark = inside && qr.isDark(row, col);
      const value = dark ? 0 : 255;
      const offset = (y * size + x) * 4;
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }

  return { pixels, size };
}

let failures = 0;

for (const testCase of CASES) {
  try {
    const urlBytes = Buffer.byteLength(testCase.url, 'utf8');
    assert.ok(
      urlBytes <= testCase.maxBytes,
      `${testCase.name}: URL tem ${urlBytes} bytes e excede a capacidade de ${testCase.maxBytes} bytes`
    );

    const qr = qrcode(testCase.version, testCase.errorCorrectionLevel);
    qr.addData(testCase.url);
    qr.make();

    assert.equal(
      qr.getModuleCount(),
      17 + testCase.version * 4,
      `${testCase.name}: dimensão inesperada para a versão ${testCase.version}`
    );

    const { pixels, size } = renderQrToRgba(qr);
    const decoded = jsQR(pixels, size, size, { inversionAttempts: 'dontInvert' });

    assert.ok(decoded, `${testCase.name}: jsQR não conseguiu decodificar o QR Code`);
    assert.equal(decoded.data, testCase.url, `${testCase.name}: texto decodificado diferente da URL original`);

    console.log(`PASS ${testCase.name}: versão ${testCase.version}, ${urlBytes} bytes, ${size}x${size}px`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}: ${error.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} de ${CASES.length} casos falharam.`);
  process.exit(1);
}

console.log(`\n${CASES.length} de ${CASES.length} casos passaram.`);
