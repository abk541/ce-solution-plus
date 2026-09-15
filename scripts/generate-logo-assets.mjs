import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourcePath = path.join(root, 'logo.avif');
const brandDir = path.join(root, 'public', 'brand');
fs.mkdirSync(brandDir, { recursive: true });

const pad = (value, width = 24) => String(value).padEnd(width, ' ');
const aspect = (w, h) => (w / h).toFixed(4);

const tempFiles = ['logo-preview.png', 'logo-on-white.png', 'logo-on-grey.png'];

const printSummary = async (files) => {
  console.log('');
  console.log('Summary table (width x height, aspect = width / height):');
  console.log(pad('File') + ' | ' + pad('Width') + ' | ' + pad('Height') + ' | Aspect');
  console.log('-'.repeat(80));
  for (const entry of files) {
    const meta = await sharp(entry.path).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    console.log(pad(entry.label) + ' | ' + pad(String(w)) + ' | ' + pad(String(h)) + ' | ' + aspect(w, h));
  }
};

(async () => {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourcePath}`);
  }

  const sourceMeta = await sharp(sourcePath).metadata();
  console.log('Source file: logo.avif');
  console.log(`Source dimensions: ${sourceMeta.width}x${sourceMeta.height}`);

  const trimmed = sharp(sourcePath).trim();
  const trimmedMeta = await trimmed.metadata();
  const trimW = trimmedMeta.width || 0;
  const trimH = trimmedMeta.height || 0;

  if (!trimW || !trimH) {
    throw new Error('Trimmed logo has zero dimensions.');
  }

  const targetW = trimW * 2;
  const targetH = trimH * 2;

  const logoDarkPng = path.join(brandDir, 'logo-dark.png');
  const logoLightPng = path.join(brandDir, 'logo-light.png');
  const logoDarkWebp = path.join(brandDir, 'logo-dark.webp');
  const logoLightWebp = path.join(brandDir, 'logo-light.webp');

  const dark2x = sharp(sourcePath)
    .trim()
    .resize(targetW, targetH, {
      fit: 'fill',
      kernel: 'nearest',
      withoutEnlargement: false,
    });

  await dark2x.png().toFile(logoDarkPng);

  const alphaBuffer = await sharp(sourcePath)
    .trim()
    .extractChannel(3)
    .toBuffer();

  const light2x = sharp({
    create: {
      width: trimW,
      height: trimH,
      channels: 3,
      background: { r: 244, g: 244, b: 241 },
    },
  }).joinChannel(alphaBuffer);

  await light2x
    .resize(targetW, targetH, {
      fit: 'fill',
      kernel: 'nearest',
      withoutEnlargement: false,
    })
    .png()
    .toFile(logoLightPng);

  await sharp(logoDarkPng).webp({ quality: 90, effort: 6 }).toFile(logoDarkWebp);
  await sharp(logoLightPng).webp({ quality: 90, effort: 6 }).toFile(logoLightWebp);

  console.log(`Trimmed source size: ${trimW}x${trimH}`);
  console.log(`Final logo output size (2x retina): ${targetW}x${targetH}`);

  const alphaRaw = await sharp(sourcePath)
    .trim()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const alphaWidth = alphaRaw.info.width;
  const alphaHeight = alphaRaw.info.height;
  const alphaData = alphaRaw.data;

  let startX = Math.floor(alphaWidth * 0.15);
  let gapStart = -1;
  let run = 0;

  for (let x = startX; x < alphaWidth; x++) {
    let transparent = true;
    for (let y = 0; y < alphaHeight; y++) {
      if (alphaData[y * alphaWidth + x] > 0) {
        transparent = false;
        break;
      }
    }

    if (transparent) {
      if (gapStart === -1) {
        gapStart = x;
      }
      run += 1;
      if (run >= 12) {
        break;
      }
    } else {
      gapStart = -1;
      run = 0;
    }
  }

  const cropWidth = run >= 12 && gapStart !== -1 ? gapStart : alphaWidth;
  const cropHeight = alphaHeight;
  const cropAspect = (cropWidth / cropHeight).toFixed(4);

  console.log(`Monogram crop width found: ${cropWidth}px`);
  console.log(`Monogram crop aspect (w/h): ${cropAspect}`);

  const markDarkPng = path.join(brandDir, 'mark-dark.png');
  const markLightPng = path.join(brandDir, 'mark-light.png');
  const markDarkWebp = path.join(brandDir, 'mark-dark.webp');
  const markLightWebp = path.join(brandDir, 'mark-light.webp');

  const markDark = sharp(sourcePath)
    .trim()
    .extract({ left: 0, top: 0, width: cropWidth, height: cropHeight })
    .resize(cropWidth * 2, cropHeight * 2, {
      fit: 'fill',
      kernel: 'nearest',
      withoutEnlargement: false,
    });

  await markDark.png().toFile(markDarkPng);

  const markAlpha = await sharp(sourcePath)
    .trim()
    .extract({ left: 0, top: 0, width: cropWidth, height: cropHeight })
    .extractChannel(3)
    .toBuffer();

  const markLight = sharp({
    create: {
      width: cropWidth,
      height: cropHeight,
      channels: 3,
      background: { r: 244, g: 244, b: 241 },
    },
  }).joinChannel(markAlpha);

  await markLight
    .resize(cropWidth * 2, cropHeight * 2, {
      fit: 'fill',
      kernel: 'nearest',
      withoutEnlargement: false,
    })
    .png()
    .toFile(markLightPng);

  await sharp(markDarkPng).webp({ quality: 90, effort: 6 }).toFile(markDarkWebp);
  await sharp(markLightPng).webp({ quality: 90, effort: 6 }).toFile(markLightWebp);

  const markCheckPng = path.join(brandDir, '_mark-check.png');
  const logoCheckPng = path.join(brandDir, '_logo-check.png');

  const markOnDark = await sharp(markLightPng).resize({
    width: (cropWidth * 2) * 3,
    height: (cropHeight * 2) * 3,
    fit: 'fill',
    kernel: 'nearest',
    withoutEnlargement: false,
  }).toBuffer();

  await sharp({
    create: {
      width: (cropWidth * 2) * 3,
      height: (cropHeight * 2) * 3,
      channels: 4,
      background: { r: 8, g: 9, b: 11, alpha: 255 },
    },
  })
    .composite([{ input: markOnDark, top: 0, left: 0 }])
    .png()
    .toFile(markCheckPng);

  await sharp({
    create: {
      width: targetW,
      height: targetH,
      channels: 4,
      background: { r: 8, g: 9, b: 11, alpha: 255 },
    },
  })
    .composite([{ input: await sharp(logoLightPng).toBuffer(), top: 0, left: 0 }])
    .png()
    .toFile(logoCheckPng);

  for (const tempFile of tempFiles) {
    const target = path.join(root, tempFile);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { force: true });
    }
  }

  const outputFiles = [
    { label: 'public/brand/logo-dark.png', path: logoDarkPng },
    { label: 'public/brand/logo-light.png', path: logoLightPng },
    { label: 'public/brand/logo-dark.webp', path: logoDarkWebp },
    { label: 'public/brand/logo-light.webp', path: logoLightWebp },
    { label: 'public/brand/mark-dark.png', path: markDarkPng },
    { label: 'public/brand/mark-light.png', path: markLightPng },
    { label: 'public/brand/mark-dark.webp', path: markDarkWebp },
    { label: 'public/brand/mark-light.webp', path: markLightWebp },
    { label: 'public/brand/_mark-check.png', path: markCheckPng },
    { label: 'public/brand/_logo-check.png', path: logoCheckPng },
  ];

  await printSummary(outputFiles);

  console.log('');
  console.log('Temporary files removed (if present):');
  for (const tempFile of tempFiles) {
    const target = path.join(root, tempFile);
    console.log(`- ${tempFile}: ${fs.existsSync(target) ? 'still exists' : 'removed'}`);
  }
})();
