import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_brand import HEXD, GAMD, ARRD, INK, LIME
picker = open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"flowstock-picker.js")).read()
T = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FlowStock — Brand mark</title>
<link rel="icon" href="app/favicon.svg" type="image/svg+xml">
<style>
  :root { --ink:#23262F; --lime:#B6FF2E; --night:#0D1117; --page:#F6F7F9; --line:#E2E5EA; --muted:#5B6474; --out:cubic-bezier(.16,1,.3,1); }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; background:var(--page); color:var(--ink); -webkit-font-smoothing:antialiased; line-height:1.5; }
  .wrap { max-width:1120px; margin:0 auto; padding:0 32px; }
  section { padding:72px 0 0; }
  h2 { font-size:22px; font-weight:700; letter-spacing:-.02em; margin-bottom:8px; }
  .lede { color:var(--muted); font-size:15px; max-width:64ch; margin-bottom:28px; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.9em; background:#ECEEF2; padding:1px 6px; border-radius:5px; }
  .hero { background:var(--night); color:#fff; padding:88px 0 80px; }
  .hero .wrap { display:grid; grid-template-columns: 300px 1fr; gap:64px; align-items:center; }
  .hero h1 { font-size:clamp(30px,4.4vw,48px); line-height:1.08; letter-spacing:-.03em; font-weight:800; margin-bottom:18px; max-width:18ch; }
  .hero p { color:#A9B2C0; font-size:17px; max-width:52ch; }
  .hero p + p { margin-top:14px; }
  .card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:24px; }
  .grid { display:grid; gap:20px; }
  .g3 { grid-template-columns:repeat(3,1fr); } .g2 { grid-template-columns:repeat(2,1fr); } .g5 { grid-template-columns:repeat(5,1fr); }
  .stage { height:150px; display:flex; align-items:center; justify-content:center; border-radius:12px; }
  .cap { margin-top:14px; font-size:13.5px; font-weight:600; } .cap small { display:block; font-weight:400; color:var(--muted); font-size:12.5px; margin-top:2px; }
  .on-dark { background:var(--night); } .on-paper { background:#fff; border:1px solid var(--line); } .on-red { background:#E5484D; } .on-lime { background:var(--lime); }
  .anat svg { width:100%; height:auto; display:block; }
  .anat text { font-family:inherit; }
  /* colour tester */
  .swatches { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; }
  .sw { border-radius:14px; padding:18px 10px 12px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; border:1px solid rgba(0,0,0,.06); }
  .sw svg { height:64px; width:auto; display:block; }
  .sw b { font-size:12px; font-weight:600; } .sw i { font-style:normal; font-size:11.5px; opacity:.8; }
  .tester { display:flex; align-items:center; gap:20px; padding:20px; border-radius:16px; margin-bottom:20px; border:1px solid var(--line); transition:background .25s var(--out); }
  .tester svg { height:96px; width:auto; flex:none; }
  .tester label { font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; }
  .tester input[type=color] { width:56px; height:40px; border:0; padding:0; background:none; cursor:pointer; border-radius:8px; }
  .tester input[type=text] { width:104px; font:inherit; font-family:ui-monospace,Menlo,monospace; font-size:13px; padding:8px 10px; border:1px solid rgba(0,0,0,.2); border-radius:8px; background:rgba(255,255,255,.75); }
  .tester .out { font-size:13.5px; font-weight:600; } .tester .out small { display:block; font-weight:400; opacity:.8; font-size:12.5px; }
  button { font:inherit; font-size:12.5px; font-weight:600; background:var(--ink); color:#fff; border:0; padding:8px 16px; border-radius:7px; cursor:pointer; }
  button:focus-visible, input:focus-visible { outline:2px solid var(--ink); outline-offset:3px; }
  .dark button { background:var(--lime); color:var(--night); }
  .rowimgs { display:flex; align-items:flex-end; gap:32px; flex-wrap:wrap; }
  .rowimgs figure { display:flex; flex-direction:column; align-items:center; gap:8px; } .rowimgs figcaption { font-size:11.5px; color:var(--muted); }
  .motion .stage { height:170px; } .motion .cap { margin-bottom:12px; }
  footer { padding:64px 0 72px; color:var(--muted); font-size:13px; }
  @media (max-width:900px){ .hero .wrap{grid-template-columns:1fr;gap:36px} .g3{grid-template-columns:repeat(2,1fr)} .g5{grid-template-columns:repeat(3,1fr)} .swatches{grid-template-columns:repeat(3,1fr)} }
  @media (max-width:560px){ .wrap{padding:0 20px} .g3,.g2{grid-template-columns:1fr} .g5{grid-template-columns:repeat(2,1fr)} .swatches{grid-template-columns:repeat(2,1fr)} .tester{flex-wrap:wrap} }
</style>
</head>
<body>

<header class="hero">
  <div class="wrap">
    <img src="mark/flowstock-mark-reverse.svg" alt="FlowStock mark" width="262" height="300" style="display:block">
    <div>
      <h1>A stock unit, cut with an F.</h1>
      <p>The hexagon is a unit of stock. The stem of the F is the stock itself, the thing that stays. The arrow is the flow, and it sits apart from the stem because it is already on its way out.</p>
      <p>One shape, cut out rather than coloured in, so it takes on whatever it sits on.</p>
    </div>
  </div>
</header>

<main class="wrap">

<section>
  <h2>How it is built</h2>
  <p class="lede">Every angle comes from the hexagon itself: 60° for the top arm's cut, 30° for the arrow's tip. Nothing is arbitrary, which is why it feels resolved at any size.</p>
  <div class="card anat">
    <svg viewBox="0 0 760 300" role="img" aria-label="Anatomy of the FlowStock mark">
      <g transform="translate(228 -6) scale(2.6)">
        <path fill-rule="evenodd" fill="#23262F" d="__HEX____GAM__"/>
        <path fill="#B6FF2E" d="__ARR__"/>
      </g>
      <g stroke="#9AA3B2" stroke-width="1" fill="none">
        <path d="M360 176 H214"/><path d="M433 98 H564"/><path d="M434 157 H564"/>
      </g>
      <g fill="#9AA3B2"><circle cx="360" cy="176" r="3"/><circle cx="433" cy="98" r="3"/><circle cx="434" cy="157" r="3"/></g>
      <g font-size="14" font-weight="700" fill="#23262F">
        <text x="204" y="172" text-anchor="end">Stock</text>
        <text x="574" y="94">60° cut</text>
        <text x="574" y="153">Flow</text>
      </g>
      <g font-size="12" fill="#5B6474">
        <text x="204" y="190" text-anchor="end">the stem, the thing that stays</text>
        <text x="574" y="112">follows the hexagon's angle</text>
        <text x="574" y="171">30° tip, apart from the stem</text>
      </g>
    </svg>
  </div>
</section>

<section>
  <h2>Colourways</h2>
  <p class="lede">Pick by surface. Light surfaces get the ink hexagon with the lime arrow; dark surfaces get the lime hexagon. The single-colour marks take any one colour you give them.</p>
  <div class="grid g5">
    <div class="card"><div class="stage on-paper"><img src="mark/flowstock-mark.svg" height="110" alt=""></div><div class="cap">Primary<small>Light surfaces</small></div></div>
    <div class="card"><div class="stage on-dark"><img src="mark/flowstock-mark-reverse.svg" height="110" alt=""></div><div class="cap">Reverse<small>Dark surfaces</small></div></div>
    <div class="card"><div class="stage on-lime"><img src="mark/flowstock-mark-black.svg" height="110" alt=""></div><div class="cap">Black<small>One-colour print, light or bright</small></div></div>
    <div class="card"><div class="stage on-red"><img src="mark/flowstock-mark-white.svg" height="110" alt=""></div><div class="cap">White<small>Mid and saturated colours</small></div></div>
    <div class="card"><div class="stage on-paper"><img src="mark/flowstock-mark-auto.svg" height="110" alt=""></div><div class="cap">Auto<small>Follows the system light or dark setting</small></div></div>
  </div>
</section>

<section>
  <h2>Any colour, any surface</h2>
  <p class="lede">The mark is cut out of the hexagon, so the background shows through the F. A small rule picks the colourway. Across a sweep of 4,096 colours covering the whole RGB range, the worst case is 3.36:1 contrast.</p>
  <div class="tester" id="tester">
    <svg id="tsvg" viewBox="18 12 84 96" aria-hidden="true"></svg>
    <label>Try a colour <input type="color" id="tcolor" value="#1F4BFF" aria-label="Background colour"><input type="text" id="thex" value="#1F4BFF" maxlength="7" aria-label="Background hex"></label>
    <div class="out" id="tout"></div>
  </div>
  <div class="swatches" id="sw"></div>
</section>

<section>
  <h2>Lockups</h2>
  <p class="lede">Horizontal for headers and documents, stacked for tight or square spaces. The wordmark is outlined, so it needs no font.</p>
  <div class="grid g2">
    <div class="card"><div class="stage on-paper" style="height:170px"><img src="lockup/flowstock-logo.svg" height="70" alt="FlowStock"></div></div>
    <div class="card"><div class="stage on-dark" style="height:170px"><img src="lockup/flowstock-logo-reverse.svg" height="70" alt="FlowStock"></div></div>
    <div class="card"><div class="stage on-paper" style="height:200px"><img src="lockup/flowstock-logo-stacked.svg" height="130" alt="FlowStock"></div></div>
    <div class="card"><div class="stage on-lime" style="height:200px"><img src="lockup/flowstock-logo-stacked-black.svg" height="130" alt="FlowStock"></div></div>
  </div>
</section>

<section>
  <h2>Small sizes and app icons</h2>
  <p class="lede">The full mark holds down to 24px. Below that the gutter between stem and arrow closes, so use the one-piece favicon, which is thicker and stays clear at 16px.</p>
  <div class="card"><div class="rowimgs">
    <figure><img src="mark/flowstock-mark.svg" height="96" alt=""><figcaption>96</figcaption></figure>
    <figure><img src="mark/flowstock-mark.svg" height="48" alt=""><figcaption>48</figcaption></figure>
    <figure><img src="mark/flowstock-mark.svg" height="32" alt=""><figcaption>32</figcaption></figure>
    <figure><img src="mark/flowstock-mark.svg" height="24" alt=""><figcaption>24, minimum</figcaption></figure>
    <figure><img src="app/favicon.svg" height="24" alt=""><figcaption>favicon 24</figcaption></figure>
    <figure><img src="app/favicon.svg" height="16" alt=""><figcaption>favicon 16</figcaption></figure>
    <figure><img src="app/flowstock-app-icon.svg" height="96" alt=""><figcaption>app icon</figcaption></figure>
    <figure><img src="app/flowstock-app-icon-light.svg" height="96" alt=""><figcaption>app icon, light</figcaption></figure>
    <figure><img src="png/icon-512-maskable.png" height="96" alt=""><figcaption>maskable</figcaption></figure>
  </div></div>
</section>

<section class="motion">
  <h2>Motion</h2>
  <p class="lede">The arrow is the only thing that moves independently, so motion always means flow. Each file's default state is the finished logo, and every one honours <code>prefers-reduced-motion</code>.</p>
  <div class="grid g3">
    <div class="card"><div class="stage on-paper"><img id="m1" data-r src="motion/flowstock-reveal.svg" height="120" alt=""></div><div class="cap">Reveal<small>Splash and hero. Plays once, about 1s.</small></div><button onclick="rp('m1')">Replay</button></div>
    <div class="card"><div class="stage on-paper"><img src="motion/flowstock-loader.svg" height="120" alt=""></div><div class="cap">Loader<small>Pending states. 1.6s per lap.</small></div></div>
    <div class="card"><div class="stage on-paper"><img src="motion/flowstock-ambient.svg" height="120" alt=""></div><div class="cap">Ambient<small>Persistent header mark. One glint every 3.6s.</small></div></div>
    <div class="card dark" style="background:var(--night);border-color:rgba(255,255,255,.08)"><div class="stage"><img id="m4" data-r src="motion/flowstock-reveal-on-dark.svg" height="120" alt=""></div><div class="cap" style="color:#fff">Reveal, on dark<small style="color:#8B94A3">The arrow opens out of the hexagon.</small></div><button onclick="rp('m4')" style="background:var(--lime);color:var(--night)">Replay</button></div>
    <div class="card" style="background:var(--night);border-color:rgba(255,255,255,.08)"><div class="stage"><img src="motion/flowstock-loader-on-dark.svg" height="120" alt=""></div><div class="cap" style="color:#fff">Loader, on dark<small style="color:#8B94A3">Comet in the ink, so it works on any dark.</small></div></div>
    <div class="card" style="background:var(--night);border-color:rgba(255,255,255,.08)"><div class="stage"><img src="motion/flowstock-ambient-on-dark.svg" height="120" alt=""></div><div class="cap" style="color:#fff">Ambient, on dark<small style="color:#8B94A3">A lime glint crosses the opening.</small></div></div>
  </div>
  <p style="margin-top:14px"><button onclick="document.querySelectorAll('img[data-r]').forEach(function(e){rp(e.id)})">Replay all</button></p>
</section>

</main>
<footer><div class="wrap">Wordmark outlined from Poppins Bold (SIL Open Font License). The mark does not depend on it, so the wordmark can be swapped without touching the hexagon.</div></footer>

<script>
__PICKER__
var HEX="__HEX__", GAM="__GAM__", ARR="__ARR__", INK="#23262F", LIME="#B6FF2E";
function markSvg(v){
  var fill=v.variant==='primary'?INK:v.hex;
  var d=HEX+GAM+(v.variant==='primary'?'':ARR);
  var a=v.variant==='primary'?'<path fill="'+LIME+'" d="'+ARR+'"/>':'';
  return '<svg viewBox="18 12 84 96" aria-hidden="true"><path fill-rule="evenodd" fill="'+fill+'" d="'+d+'"/>'+a+'</svg>';
}
function textOn(bg){return flowstockVariant.ratio('#FFFFFF',bg)>=flowstockVariant.ratio('#000000',bg)?'#fff':'#0D1117';}
var NAMES={'White':'#FFFFFF','Silver':'#C9CED8','Mid grey':'#808080','Slate':'#475569','Charcoal':'#23262F','Black':'#000000','Red':'#E5484D','Crimson':'#B4142A','Orange':'#F76B15','Amber':'#FFB224','Yellow':'#FFD60A','Lime':'#B6FF2E','Green':'#12A150','Forest':'#0B4F2C','Teal':'#0E9AA7','Sky':'#4CC2FF','Blue':'#1F4BFF','Navy':'#0B1F5C','Purple':'#8E4EC6','Magenta':'#D6409F','Pink':'#FFB3D1','Indigo':'#4338CA','Paper':'#F1F5F9','Sand':'#E8DCC4'};
var LABEL={primary:'Ink hexagon, lime arrow',reverse:'Lime hexagon',white:'White mark',black:'Black mark'};
var sw=document.getElementById('sw'), html='';
Object.keys(NAMES).forEach(function(n){var c=NAMES[n],v=flowstockVariant(c),t=textOn(c);
  html+='<div class="sw" style="background:'+c+';color:'+t+'">'+markSvg(v)+'<div><b>'+n+'</b><br><i>'+LABEL[v.variant]+' · '+v.ratio.toFixed(1)+':1</i></div></div>';});
sw.innerHTML=html;
function test(c){
  if(!/^#[0-9a-fA-F]{6}$/.test(c))return; var v=flowstockVariant(c);
  var el=document.getElementById('tester'); el.style.background=c; el.style.color=textOn(c);
  document.getElementById('tsvg').outerHTML=markSvg(v).replace('<svg ','<svg id="tsvg" ');
  document.getElementById('tout').innerHTML=LABEL[v.variant]+'<small>'+v.ratio.toFixed(1)+':1 · '+v.file+'</small>';
  document.getElementById('tcolor').value=c; document.getElementById('thex').value=c.toUpperCase();
}
document.getElementById('tcolor').addEventListener('input',function(e){test(e.target.value)});
document.getElementById('thex').addEventListener('input',function(e){test(e.target.value)});
test('#1F4BFF');
function rp(id){var e=document.getElementById(id);e.setAttribute('src',e.getAttribute('src').split('?')[0]+'?t='+Date.now());}
</script>
</body>
</html>
'''
T = T.replace("__PICKER__", picker).replace("__HEX____GAM__", HEXD + GAMD).replace("__HEX__", HEXD).replace("__GAM__", GAMD).replace("__ARR__", ARRD)
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","preview.html"), "w").write(T); print("preview.html", len(T.encode()), "B")
