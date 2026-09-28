/* FlowStock — pick the right logo colourway for ANY background colour.
 *   flowstockVariant('#E5484D')  ->  { variant:'white', file:'flowstock-mark-white.svg', ratio:4.0 }
 * Order is brand-first: keep the ink hexagon (with the lime arrow) whenever it is clearly legible,
 * then the lime hexagon, then a single-colour mark. Thresholds: 4.5:1 for the two brand colourways,
 * 3:1 for the mono marks (WCAG's bar for large graphics). No background falls through all four. */
(function (root) {
  var INK = '#23262F', LIME = '#B6FF2E', WHITE = '#FFFFFF', BLACK = '#000000';
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(hex) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16); return 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255);
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); if (x < y) { var t = x; x = y; y = t; } return (x + 0.05) / (y + 0.05); }
  function flowstockVariant(bg) {
    var r;
    if ((r = ratio(INK, bg))   >= 4.5) return { variant: 'primary', file: 'flowstock-mark.svg',         ratio: r, hex: INK };
    if ((r = ratio(LIME, bg))  >= 4.5) return { variant: 'reverse', file: 'flowstock-mark-reverse.svg', ratio: r, hex: LIME };
    if ((r = ratio(WHITE, bg)) >= 3)   return { variant: 'white',   file: 'flowstock-mark-white.svg',   ratio: r, hex: WHITE };
    r = ratio(BLACK, bg);              return { variant: 'black',   file: 'flowstock-mark-black.svg',   ratio: r, hex: BLACK };
  }
  flowstockVariant.ratio = ratio;
  if (typeof module !== 'undefined') module.exports = flowstockVariant; else root.flowstockVariant = flowstockVariant;
})(this);
