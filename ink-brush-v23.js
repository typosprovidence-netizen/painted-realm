/* Shared V2.2 pigment renderer. No gameplay state, WebGL access or network calls. */
(() => {
'use strict';
const TAU=Math.PI*2,INK='#101511',PAPER='#eee8da',KEY='painted-realm.inkfx.v23';
const presets={low:{density:.88,width:.95,splash:.55,bleed:.45,life:.85},medium:{density:.97,width:1.15,splash:1,bleed:.8,life:1},high:{density:1,width:1.4,splash:1.45,bleed:1.2,life:1.15}};
const limits={density:[.55,1],width:[.65,1.8],splash:[0,1.8],bleed:[0,1.8],life:[.5,1.5]};
let config={...presets.medium},preset='medium',seed=22025,dropsLeft=48,frames=0;
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const atlases=[];let cacheBytes=0;
function ribbon(ctx,points,widths,color){
 ctx.fillStyle=color;ctx.beginPath();
 for(let side=1;side>=-1;side-=2){
  for(let j=0;j<points.length;j++){const i=side===1?j:points.length-1-j,p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,x=p.x-dy/len*widths[i]*side,y=p.y+dx/len*widths[i]*side;if(!j&&side===1)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
 }ctx.closePath();ctx.fill();
}
function fibres(ctx,w,h,count){
 ctx.save();ctx.globalCompositeOperation='destination-out';
 // Tiny exposed paper channels break the edge, leaving the body substantially opaque.
 for(let i=0;i<count;i++){const x=rnd()*w,y=rnd()*h;ctx.globalAlpha=.3+rnd()*.45;ctx.fillRect(x,y,2+rnd()*15,.4+rnd()*1.1)}
 ctx.restore();
}
for(let variant=0;variant<3;variant++){
 const strip=canvas(384,128),s=strip.getContext('2d'),points=[],widths=[];
 for(let i=0;i<=40;i++){const t=i/40;points.push({x:8+t*366,y:64+Math.sin(t*8+variant)*5});const envelope=Math.pow(Math.sin(t*Math.PI),.62)*(1-.62*Math.pow(t,5));widths.push((3+31*envelope)*(1+.15*Math.sin(t*41+variant)+.08*Math.sin(t*89)))}
 ribbon(s,points,widths,INK);fibres(s,384,128,140);
 // The back end has broken tufts; the front remains a narrow, sharp nib.
 s.globalCompositeOperation='destination-out';s.globalAlpha=1;
 for(let j=0;j<16;j++){s.beginPath();s.moveTo(0,30+j*4);s.lineTo(25+rnd()*65,33+j*4);s.lineTo(0,35+j*4);s.fill()}
 const wet=canvas(384,128),w=wet.getContext('2d');
 for(let j=0;j<3;j++){w.globalAlpha=.035+j*.015;ribbon(w,points,widths.map(n=>n*(1.45-j*.10)),INK)}
 const slash=canvas(384,256),a=slash.getContext('2d'),arc=[],aw=[];
 for(let i=0;i<=48;i++){
 const t=i/48;arc.push({x:20+t*345,y:133-40*Math.sin(t*Math.PI)+16*t});
 // A readable stroke with a broad initial load and a single sharp forward tip.
 const nib=t>.90?Math.pow((1-t)/.1,1.5):1;
 aw.push((3+25*Math.pow(1-t,1.35))*(.72+.28*Math.min(1,t*10))*nib*(1+.08*Math.sin(t*53+variant)));
}
 ribbon(a,arc,aw,INK);fibres(a,384,256,145);
 const slashWet=canvas(384,256),sw=slashWet.getContext('2d');sw.globalAlpha=.10;ribbon(sw,arc,aw.map(n=>n*1.4),INK);
 const stamp=canvas(160,160),c=stamp.getContext('2d');c.fillStyle=INK;c.beginPath();
 for(let i=0;i<=80;i++){const a=i/80*TAU,r=39+8*Math.sin(a*5+variant)+5*Math.sin(a*13)+rnd()*6;const x=80+Math.cos(a)*r,y=80+Math.sin(a)*r*.75;if(!i)c.moveTo(x,y);else c.lineTo(x,y)}c.fill();fibres(c,160,160,95);
 // A filled annular contour is cached: no single enlarged circular stroke.
 const ring=canvas(192,192),rc=ring.getContext('2d');rc.fillStyle=INK;
 for(let j=0;j<7;j++){const start=j*TAU/7+.02,end=(j+.86)*TAU/7;rc.beginPath();for(let i=0;i<=12;i++){const a=start+(end-start)*i/12,r=68+3*Math.sin(a*11+variant);const x=96+Math.cos(a)*r,y=96+Math.sin(a)*r*.65;if(!i)rc.moveTo(x,y);else rc.lineTo(x,y)}for(let i=12;i>=0;i--){const a=start+(end-start)*i/12,r=61+4*Math.sin(a*9+variant);rc.lineTo(96+Math.cos(a)*r,96+Math.sin(a)*r*.65)}rc.closePath();rc.fill()}fibres(rc,192,192,95);
 atlases.push({strip,wet,slash,slashWet,stamp,ring});
 for(const x of Object.values(atlases.at(-1)))cacheBytes+=x.width*x.height*4;
}
const grains=Array.from({length:24},(_,i)=>({spread:(rnd()-.5)*1.05,velocity:.55+rnd()*1.25,offset:rnd()*.18,size:[.035,.07,.12,.05,.18,.085][i%6],bend:(rnd()-.5)*.3}));
const envelope=t=>t<.16?1:Math.pow(Math.max(0,1-(t-.16)/.84),1.3);
function beginFrame(){dropsLeft=preset==='low'?24:preset==='high'?72:48;frames++}
function droplets(ctx,x,y,angle,unit,t,strength=1){
 const count=Math.min(dropsLeft,Math.floor((preset==='low'?6:10)*config.splash*strength));dropsLeft-=count;
 ctx.save();ctx.fillStyle=INK;ctx.globalAlpha*=config.density*envelope(t);
 for(let i=0;i<count;i++){const d=grains[i],a=angle+d.spread,r=unit*(d.offset+(t*.95+.05)*d.velocity*1.65),px=x+Math.cos(a)*r,py=y+Math.sin(a)*r+unit*t*t*.22,size=Math.max(.9,unit*d.size*(1-t*.65));ctx.beginPath();ctx.ellipse(px,py,size*(1.2+d.velocity*.25),size*.55,a,0,TAU);ctx.fill()}
 ctx.restore();
}
function line(ctx,x1,y1,x2,y2,width,t=0,variant=0){
 const len=Math.hypot(x2-x1,y2-y1);if(len<.5)return;const a=atlases[Math.abs(variant)%3],h=width*config.width,opacity=config.density*envelope(t)*ctx.globalAlpha;
 ctx.save();ctx.translate(x1,y1);ctx.rotate(Math.atan2(y2-y1,x2-x1));
 if(config.bleed>0){ctx.globalAlpha*=opacity*config.bleed*.7;const grow=1+.18*Math.sqrt(t);ctx.drawImage(a.wet,0,-h*grow,len,h*2*grow)}
 ctx.globalAlpha=opacity;ctx.drawImage(a.strip,0,-h,len,h*2);ctx.restore();
}
function slash(ctx,e){
 const a=atlases[e.variant%3],t=e.t,unit=e.unit,scale=unit/85,opacity=envelope(t)*config.density;
 ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.scale(scale*(.85+.25*Math.min(1,t*6)),scale*.72*config.width);
 if(config.bleed>0){ctx.globalAlpha=opacity*config.bleed*.55;ctx.drawImage(a.slashWet,-20,-128,384,256)}
 ctx.globalAlpha=opacity;ctx.drawImage(a.slash,-20,-128,384,256);ctx.restore();
 droplets(ctx,e.x+Math.cos(e.angle)*unit*1.8,e.y+Math.sin(e.angle)*unit*1.8,e.angle,unit*.7,t,.7);
}
function impact(ctx,e){
 const a=atlases[e.variant%3],t=e.t,u=e.unit,opacity=config.density*envelope(t);
 ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);
 // A short directional incision rather than a central opaque blot.
 if(config.bleed>0){ctx.globalAlpha=opacity*.10*config.bleed;ctx.drawImage(a.stamp,-u*.30,-u*.26,u*.60,u*.52)}
 ctx.globalAlpha=opacity;ctx.drawImage(a.strip,-u*.42,-u*.16*config.width,u*1.85,u*.32*config.width);
 if(t<.2){ctx.fillStyle=INK;for(let j=0;j<3;j++){const yy=(j-1)*u*.12;ctx.beginPath();ctx.moveTo(-u*.1,yy);ctx.lineTo(u*(.55+j*.18),yy-u*.055);ctx.lineTo(u*.25,yy+u*.055);ctx.closePath();ctx.fill()}}
 ctx.restore();
 if(t<.36){ctx.save();ctx.globalAlpha=opacity*.48*(1-t/.36);const r=u*(.68+t*.75);ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.drawImage(a.ring,-r,-r,2*r,2*r);ctx.restore()}
 droplets(ctx,e.x,e.y,e.angle,u*.85,t,.7);
}
function transition(ctx,w,h,t,target,hero,plane){
 const pulse=Math.max(0,Math.sin(t*Math.PI));if(pulse<.005)return;
 // The game passes the geometry of its live composited canvas. Gallery is only illustrative.
 if(!plane){const z=t<.5?1-1.56*t:.22+1.56*(t-.5);plane={left:w*.06*(1-z),top:h*.25*(1-z),width:w*(.88+.12*z),height:h*z}}
 const left=plane.left,top=plane.top,right=left+plane.width,bottom=top+plane.height,cy=(top+bottom)*.5;
 ctx.save();ctx.beginPath();ctx.rect(0,0,w,h);ctx.ellipse(hero.x,hero.y,Math.max(42,hero.unit*.75),Math.max(40,hero.unit*1.4*(plane.sy||1)),0,0,TAU);ctx.clip('evenodd');
 // Slim warm paper margins expose the shape of the unfolding scroll, without a white flash.
 ctx.globalAlpha=pulse*.8;ctx.fillStyle=PAPER;ctx.fillRect(left-4,top-5,plane.width+8,7);ctx.fillRect(left-4,bottom-2,plane.width+8,7);
 ctx.globalAlpha=pulse*.75;line(ctx,left,top,right,top,3.2,t*.3,0);line(ctx,right,bottom,left,bottom,3.2,t*.3,2);
 const extent=plane.width*(.21+.13*pulse),center=left+plane.width*.5;
 // Two brush currents gather inward on entry, and open outward on exit.
 for(const side of [-1,1]){
  const edge=center+side*extent,near=center+side*18;
  ctx.globalAlpha=pulse*.85;
  if(target==='2D')line(ctx,edge,cy+side*10,near,cy,8*pulse,t*.35,side<0?0:1);
  else line(ctx,near,cy,edge,cy+side*10,8*pulse,t*.35,side<0?1:2);
 }
 ctx.restore();
}
function setConfig(values,which='custom'){
 for(const [key,[lo,hi]] of Object.entries(limits))if(Number.isFinite(Number(values[key])))config[key]=clamp(Number(values[key]),lo,hi);
 preset=which;window.dispatchEvent(new CustomEvent('inkfx22-config'));return {...config};
}
function applyPreset(name){if(presets[name])setConfig(presets[name],name)}
let saved=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:'2.3',preset,config}));saved=true;return true}catch{return false}}
function exportConfig(){const value=JSON.stringify({version:'2.3',preset,config:{...config}},null,2),url=URL.createObjectURL(new Blob([value],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='painted-realm-ink-v23-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return value}
try{const raw=localStorage.getItem(KEY);if(raw){const value=JSON.parse(raw);if(value.version==='2.3')setConfig(value.config,presets[value.preset]?value.preset:'custom')}}catch{/* File contexts can deny storage. Export remains available. */}
function mountPanel(host=document.body){
 const panel=document.createElement('details');panel.className='ink22-panel';panel.id='ink22-panel';
 panel.innerHTML='<summary>墨效调校 <small>V2.3</small></summary><div class="ink22-body"><label>预设<select id="ink22-preset" aria-label="墨效预设"><option value="low">低 · 克制</option><option value="medium">中 · 浓墨</option><option value="high">高 · 重锋</option><option value="custom">自定义</option></select></label>'+Object.entries({density:'墨色浓度',width:'主体笔触粗细',splash:'飞溅强度',bleed:'渗墨强度',life:'特效寿命'}).map(([key,label])=>`<label for="ink22-${key}">${label}<output id="ink22-${key}-value"></output><input id="ink22-${key}" data-param="${key}" type="range" min="${limits[key][0]}" max="${limits[key][1]}" step=".01"></label>`).join('')+'<p class="ink22-hint">寿命仅作用于墨迹，切换判定仍为原来的 0.3 秒。</p><div class="ink22-actions"><button id="ink22-save" type="button">保存本机</button><button id="ink22-export" type="button">导出 JSON</button></div><p id="ink22-status" role="status">参数只影响显示，不改变游戏数值。</p></div>';
 for(const name of ['mousedown','pointerdown','keydown','keyup'])panel.addEventListener(name,e=>e.stopPropagation());
 panel.querySelector('select').addEventListener('change',e=>applyPreset(e.target.value));
 for(const el of panel.querySelectorAll('input'))el.addEventListener('input',()=>setConfig({[el.dataset.param]:Number(el.value)}));
 panel.querySelector('#ink22-save').addEventListener('click',()=>{panel.querySelector('#ink22-status').textContent=save()?'已保存到此浏览器，下次打开自动恢复。':'浏览器不允许本机保存，请导出 JSON。'});
 panel.querySelector('#ink22-export').addEventListener('click',()=>{exportConfig();panel.querySelector('#ink22-status').textContent='已导出参数 JSON。'});
 function sync(){panel.querySelector('select').value=preset;for(const el of panel.querySelectorAll('input')){el.value=config[el.dataset.param];panel.querySelector('#ink22-'+el.dataset.param+'-value').value=config[el.dataset.param].toFixed(2)}}
 window.addEventListener('inkfx22-config',sync);sync();host.appendChild(panel);return panel;
}
window.InkBrush22={beginFrame,line,slash,impact,transition,setConfig,applyPreset,mountPanel,save,exportConfig,get config(){return {...config}},get preset(){return preset},stats:()=>({atlasCount:atlases.length*6,cacheBytes,frames,preset,config:{...config},saved,dropsRemaining:dropsLeft}),version:'2.3'};
})();
