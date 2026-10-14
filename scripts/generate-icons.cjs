const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact Dandelious Flower vector paths matching DandeliousLogo component
const flowerSvgInner = `
  <g fill="#FFFFFF">
    <!-- Main Blossom Silhouette -->
    <path d="M250 82 C266 82 278 114 278 135 C288 126 312 135 320 152 C327 167 348 178 356 195 C365 214 388 228 393 249 C398 271 420 286 422 308 C424 330 404 345 402 366 C400 388 381 405 373 424 C365 444 344 459 332 476 C320 493 298 506 280 519 C266 529 252 536 242 536 C236 536 230 488 226 446 C224 430 200 482 190 523 C183 527 162 516 150 498 C138 480 119 464 110 443 C102 422 84 403 80 380 C76 357 58 340 58 316 C58 292 78 277 82 254 C86 231 106 215 116 194 C126 173 148 160 162 142 C168 134 176 138 184 156 C192 174 200 180 206 172 C212 164 220 132 232 108 C238 96 244 82 250 82 Z" />
    
    <!-- Radiating Petals & Details -->
    <path d="M245 62 C248 60 258 60 262 65 C266 75 264 120 258 128 C252 135 244 135 240 120 C237 105 240 70 245 62 Z" />
    <path d="M285 78 C290 76 298 80 304 90 C310 102 308 140 300 148 C292 154 286 148 282 134 C278 120 280 90 285 78 Z" />
    <path d="M214 85 C218 80 226 82 232 94 C238 108 234 144 228 152 C222 158 214 152 210 138 C206 122 208 96 214 85 Z" />
    
    <!-- Top-left characteristic hooked notch petal -->
    <path d="M125 138 C122 140 118 146 118 154 C118 164 128 174 136 174 C144 174 150 185 158 198 C166 210 174 212 172 198 C168 180 156 162 144 148 C136 138 128 136 125 138 Z" />
    
    <!-- Outer perimeter brush strokes -->
    <path d="M336 105 C344 100 354 108 360 124 C368 142 360 178 350 186 C340 194 332 184 328 166 C324 146 328 116 336 105 Z" />
    <path d="M380 145 C390 142 398 152 404 170 C410 190 398 220 386 226 C376 230 368 218 366 198 C364 178 370 152 380 145 Z" />
    <path d="M415 200 C426 200 435 212 438 232 C442 254 426 278 412 282 C400 284 394 270 394 250 C394 228 402 205 415 200 Z" />
    <path d="M434 265 C446 268 454 282 454 304 C454 326 436 344 422 344 C410 344 406 330 408 310 C410 288 420 266 434 265 Z" />
    <path d="M428 335 C438 340 445 358 440 380 C435 402 414 416 400 414 C388 412 386 396 390 376 C394 354 414 334 428 335 Z" />
    <path d="M398 402 C408 410 412 430 402 452 C392 472 370 480 358 474 C346 468 348 450 356 430 C364 410 386 396 398 402 Z" />
    <path d="M352 460 C360 470 358 492 344 512 C330 530 310 532 298 522 C288 512 294 494 306 476 C318 458 342 450 352 460 Z" />

    <!-- Left perimeter brush strokes -->
    <path d="M90 180 C82 176 72 186 64 204 C56 224 68 252 80 256 C90 260 98 246 98 226 C98 206 96 186 90 180 Z" />
    <path d="M60 248 C50 248 40 262 36 284 C32 306 46 330 60 332 C72 334 78 318 78 298 C78 276 72 252 60 248 Z" />
    <path d="M48 322 C38 326 32 344 34 366 C36 388 52 406 66 404 C78 402 82 386 80 366 C78 344 60 322 48 322 Z" />
    <path d="M64 395 C54 402 52 422 60 444 C68 464 88 474 100 468 C112 460 112 442 106 422 C100 402 76 390 64 395 Z" />
    <path d="M96 455 C88 466 90 488 102 508 C114 526 134 530 144 518 C154 506 148 488 138 470 C128 452 106 446 96 455 Z" />
    <path d="M142 505 C136 518 144 538 160 550 C174 560 194 554 200 540 C206 524 196 508 182 496 C168 484 148 494 142 505 Z" />

    <!-- Pure dense core disc -->
    <circle cx="250" cy="310" r="140" fill="#FFFFFF" />
  </g>
`;

// Full SVG badge with #C5DC57 background
const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="dandeliousBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#C9E05C" />
      <stop offset="50%" stopColor="#C5DC57" />
      <stop offset="100%" stopColor="#B3CD43" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.08" />
    </filter>
  </defs>
  
  <!-- Rounded Squircle Badge Base -->
  <rect width="512" height="512" rx="112" fill="url(#dandeliousBg)" />
  
  <!-- Subtle Inset Highlight -->
  <rect x="2" y="2" width="508" height="508" rx="110" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" />

  <!-- Dandelion Bloom Centered -->
  <g transform="translate(68, 56) scale(0.75)" filter="url(#subtleShadow)">
    ${flowerSvgInner}
  </g>
</svg>`;

// Full-bleed version for PWA maskable icons
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="dandeliousBgFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#C9E05C" />
      <stop offset="50%" stopColor="#C5DC57" />
      <stop offset="100%" stopColor="#B3CD43" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#dandeliousBgFull)" />
  <g transform="translate(96, 80) scale(0.64)">
    ${flowerSvgInner}
  </g>
</svg>`;

async function generate() {
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), badgeSvg, 'utf-8');
  console.log('Saved public/icon.svg');

  // 2. Generate 512x512 PNG
  const badgeBuffer = Buffer.from(badgeSvg);
  await sharp(badgeBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated public/icon-512.png');

  // 3. Generate 192x192 PNG
  await sharp(badgeBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated public/icon-192.png');

  // 4. Generate apple-touch-icon.png (180x180)
  await sharp(badgeBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // 5. Generate favicon.png (64x64) and favicon.ico
  await sharp(badgeBuffer)
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  await sharp(badgeBuffer)
    .resize(48, 48)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated public/favicon.ico & public/favicon.png');

  console.log('All Dandelious icons successfully created and synchronized with the in-app emblem!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
