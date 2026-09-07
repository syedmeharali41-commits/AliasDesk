const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcon() {
  const rootDir = path.resolve(__dirname, '..');
  const logoPath = path.join(rootDir, 'public', 'logo.png');
  const icoPath = path.join(rootDir, 'public', 'favicon.ico');

  if (!fs.existsSync(logoPath)) {
    console.error('public/logo.png not found!');
    return;
  }

  const pngBuffer = await sharp(logoPath).resize(256, 256).png().toBuffer();

  // Construct standard Windows ICO with embedded PNG
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);       // Reserved
  header.writeUInt16LE(1, 2);       // Image type: 1 = ICO
  header.writeUInt16LE(1, 4);       // Number of images: 1

  header.writeUInt8(0, 6);          // Width: 0 = 256px
  header.writeUInt8(0, 7);          // Height: 0 = 256px
  header.writeUInt8(0, 8);          // Palette count: 0 = no palette
  header.writeUInt8(0, 9);          // Reserved
  header.writeUInt16LE(1, 10);      // Color planes: 1
  header.writeUInt16LE(32, 12);     // Bits per pixel: 32
  header.writeUInt32LE(pngBuffer.length, 14); // Image data size in bytes
  header.writeUInt32LE(22, 18);     // Offset of image data from beginning of file

  const icoBuffer = Buffer.concat([header, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('✅ Generated public/favicon.ico successfully (' + icoBuffer.length + ' bytes)');
}

generateIcon().catch(console.error);
