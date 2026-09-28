const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  async function png(svgFile, w, h, out, bg) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const svg = fs.readFileSync(svgFile, 'utf8');
    await p.setContent(`<body style="margin:0;background:${bg||'transparent'}"><div style="width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center">${svg}</div><style>svg{width:100%;height:100%;display:block}</style></body>`);
    await p.screenshot({ path: out, omitBackground: !bg }); await p.close();
  }
  for (const s of [16, 32, 48]) await png('../app/favicon.svg', s, s, `../png/favicon-${s}.png`);
  await png('../app/flowstock-app-icon-square.svg', 180, 180, '../png/apple-touch-icon.png');
  await png('../app/flowstock-app-icon.svg', 192, 192, '../png/icon-192.png');
  await png('../app/flowstock-app-icon.svg', 512, 512, '../png/icon-512.png');
  await png('../app/flowstock-app-icon-maskable.svg', 512, 512, '../png/icon-512-maskable.png');
  // social card 1200x630: reverse lockup, centred, on the brand dark
  const lock = fs.readFileSync('../lockup/flowstock-logo-reverse.svg', 'utf8');
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(`<body style="margin:0;background:#0D1117;width:1200px;height:630px;display:flex;align-items:center;justify-content:center"><div style="width:640px">${lock}</div><style>svg{width:100%;height:auto;display:block}</style></body>`);
  await p.screenshot({ path: '../png/og-1200x630.png' }); await p.close();
  await b.close();
})();
