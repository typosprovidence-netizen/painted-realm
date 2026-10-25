/* Map 1 material pass. Two cached GPU textures, one cached Canvas cliff brush. No new world objects. */
(function(){
'use strict';
// The core gracefully reports WebGL initialization failures; do not cascade adapter errors.
if(!window.__REALM_BOOTED__)return;
if(new URLSearchParams(location.search).get('stage')==='character')return;
let seed=1307;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const ground=canvas(1024,1024),g=ground.getContext('2d');g.fillStyle='#dedbd0';g.fillRect(0,0,1024,1024);
// Dry shore washes stay near the arena edges. Centre kept clear for combat warnings.
for(let i=0;i<36;i++){const x=rnd()*1024,y=rnd()*1024;if(x>160&&x<864&&y>150&&y<900)continue;g.fillStyle='rgba(74,83,69,.045)';g.beginPath();g.ellipse(x,y,65+rnd()*120,7+rnd()*20,rnd()*.25,0,Math.PI*2);g.fill()}
for(let i=0;i<12000;i++){g.fillStyle=i%3?'rgba(60,65,50,.035)':'rgba(255,252,239,.26)';g.fillRect(rnd()*1024,rnd()*1024,1+rnd()*3,.6)}
for(let row=1;row<8;row++){const y=row*128;g.strokeStyle='rgba(77,84,72,.10)';g.lineWidth=.8;g.beginPath();g.moveTo(0,y);g.lineTo(1024,y+1);g.stroke();for(let j=0;j<5;j++){const x=j*220+(row%2)*100;g.beginPath();g.moveTo(x,y);g.lineTo(x+3,y+128);g.stroke()}}
const floorTex=new THREE.CanvasTexture(ground);floorTex.colorSpace=THREE.SRGBColorSpace;floorTex.anisotropy=2;
const stone=canvas(256,256),s=stone.getContext('2d');s.fillStyle='#bec2b5';s.fillRect(0,0,256,256);
for(let i=0;i<160;i++){const y=rnd()*256;s.strokeStyle=i%3?'rgba(38,45,36,.11)':'rgba(248,244,224,.35)';s.lineWidth=.4+rnd()*1.8;s.beginPath();s.moveTo(rnd()*70,y);s.lineTo(100+rnd()*156,y+rnd()*7);s.stroke()}
const stoneTex=new THREE.CanvasTexture(stone);stoneTex.colorSpace=THREE.SRGBColorSpace;
const baseFloor=WORLD_REFS.materials.floor.map,baseStone=WORLD_REFS.materials.stone.map;
const cages=lanterns.map(l=>l.children.find(n=>n.isMesh&&n.geometry.type==='CylinderGeometry'&&n.position.y>3.2));
const cageOriginal=cages.map(n=>n&&({color:n.material.color.clone(),emissive:n.material.emissive.clone(),roughness:n.material.roughness,metalness:n.material.metalness,emissiveIntensity:n.material.emissiveIntensity}));
function apply(){
const first=GameState.current3DLevel===1,m=WORLD_REFS.materials;
m.floor.map=first?floorTex:baseFloor;m.stone.map=first?stoneTex:baseStone;m.floor.needsUpdate=true;m.stone.needsUpdate=true;
if(first){m.floor.color.set('#f1eee4');m.stone.color.set('#778174');m.darkStone.color.set('#374238');m.wood.color.set('#454a3f');m.gold.color.set('#b3ac91');m.gold.emissiveIntensity=0;m.gold.metalness=0;
scene.background.set('#e9e7dc');scene.fog.color.set('#e9e7dc');WORLD_REFS.lights.hemisphere.color.set('#faf5e8');WORLD_REFS.lights.hemisphere.groundColor.set('#a3a698');
}
cages.forEach((n,i)=>{if(!n)return;const b=cageOriginal[i];n.material.color.copy(first?new THREE.Color('#d5cdb5'):b.color);n.material.emissive.copy(first?new THREE.Color('#8b7152'):b.emissive);n.material.roughness=first?1:b.roughness;n.material.metalness=first?0:b.metalness;n.material.emissiveIntensity=first?.08:b.emissiveIntensity});
}
const theme=applyMapTheme;applyMapTheme=function(...args){const r=theme.apply(this,args);apply();return r};apply();
const cliff=canvas(512,128),c=cliff.getContext('2d');
c.fillStyle='rgba(60,72,59,.14)';c.beginPath();c.moveTo(0,8);c.lineTo(512,7);c.lineTo(443,60);c.lineTo(332,83);c.lineTo(240,118);c.lineTo(81,75);c.lineTo(22,44);c.closePath();c.fill();
for(let i=0;i<85;i++){const x=rnd()*512,y=18+rnd()*62;c.strokeStyle=i%4?'rgba(53,65,51,.17)':'rgba(242,236,219,.50)';c.lineWidth=.6+rnd()*1.3;c.beginPath();c.moveTo(x,y);c.lineTo(x-9-rnd()*19,y+8+rnd()*22);c.stroke()}
c.fillStyle='#303e33';c.beginPath();c.moveTo(0,8);c.lineTo(30,3);c.lineTo(172,7);c.lineTo(326,2);c.lineTo(512,6);c.lineTo(495,13);c.lineTo(214,11);c.lineTo(18,14);c.closePath();c.fill();
for(let i=0;i<48;i++){c.fillStyle=i%3?'rgba(231,228,206,.54)':'rgba(27,38,29,.84)';c.fillRect(rnd()*512,6+rnd()*5,3+rnd()*22,.5+rnd())}
const platforms=draw2DPlatforms,groundDraw=draw2DGround;
draw2DPlatforms=function(ctx,v){if(GameState.current2DLevel!==1)return platforms(ctx,v);for(let i=0;i<ROOM2D.platforms.length;i++){const p=ROOM2D.platforms[i],x=v.sx(p.u-p.w/2),y=v.sy(p.v),w=p.w*v.scale;if(x>v.width+40||x+w<0)continue;ctx.drawImage(cliff,x,y-4,w,v.scale*.72);if(i===1||i===5){ctx.fillStyle='#983d30';ctx.fillRect(x+w*.78,y-21,8,17)}}};
draw2DGround=function(ctx,v){if(GameState.current2DLevel!==1)return groundDraw(ctx,v);const y=v.sy(0);ctx.fillStyle='#dedccc';ctx.fillRect(0,y,v.width,v.height-y);ctx.drawImage(cliff,0,y-5,v.width,v.scale*.75)};
window.SceneV3={stats:()=>({gpuTextures:2,cachedCanvasBrushes:1,generatedPixels:1024*1024+256*256+512*128,extraObjects:0})};
})();
