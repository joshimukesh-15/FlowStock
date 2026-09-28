const pick = require('./flowstock-picker.js');
const bgs = {
 'White':'#FFFFFF','Paper':'#F1F5F9','Silver':'#C9CED8','Mid grey':'#808080','Slate':'#475569','Charcoal':'#23262F','Near-black':'#0D1117','Black':'#000000',
 'Red':'#E5484D','Crimson':'#B4142A','Orange':'#F76B15','Amber':'#FFB224','Yellow':'#FFD60A','Lime':'#B6FF2E','Green':'#12A150','Forest':'#0B4F2C',
 'Teal':'#0E9AA7','Sky':'#4CC2FF','Blue':'#1F4BFF','Navy':'#0B1F5C','Indigo':'#4338CA','Purple':'#8E4EC6','Magenta':'#D6409F','Pink':'#FFB3D1'};
let min=99, rows=[];
for (const [n,c] of Object.entries(bgs)) { const r=pick(c); min=Math.min(min,r.ratio); rows.push([n,c,r.variant,r.ratio.toFixed(1)]); }
rows.forEach(r=>console.log(r.join('\t')));
console.log('WORST-CASE ratio across',rows.length,'backgrounds:',min.toFixed(2));
// sweep: every grey and a coarse RGB cube
let worst={r:99,c:''}, n=0;
for(let r=0;r<=255;r+=17)for(let g=0;g<=255;g+=17)for(let b=0;b<=255;b+=17){const c='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');const x=pick(c);n++;if(x.ratio<worst.r)worst={r:x.ratio,c,v:x.variant};}
console.log('sweep of',n,'colours -> worst',worst.r.toFixed(2),worst.c,worst.v);
