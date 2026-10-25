/* Original procedural artwork. Presentation only: reads state, never writes game rules. */
(function(){
'use strict';
if(!window.__REALM_BOOTED__)return;
const C={ink:'#202722',deep:'#141c19',wash:'#526058',paper:'#dedfd3',light:'#eeeadc',red:'#983d30'};
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:1,metalness:0});
const M={ink:mat(C.ink),deep:mat(C.deep),wash:mat(C.wash),paper:mat(C.paper),light:mat(C.light),red:mat(C.red)};
const rig=player.userData.rig;
// Keep original nodes and references alive for the original animation and ghost systems.
const originals=[...rig.children];originals.forEach(n=>n.visible=false);
const walker=new THREE.Group();walker.name='V3_ink_walker_visual';rig.add(walker);
function mesh(g,m,parent,x=0,y=0,z=0){const n=new THREE.Mesh(g,m);n.position.set(x,y,z);n.castShadow=true;n.receiveShadow=true;parent.add(n);return n}
function cloth(points,depth,m,parent,x=0,y=0,z=0){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),m,parent,x,y,z)}
const footGeo=new THREE.BoxGeometry(.19,.18,.39),legGeo=new THREE.CylinderGeometry(.078,.09,.38,6);
const legs=[],knees=[],feet=[];
for(const side of [-1,1]){const hip=new THREE.Group();hip.position.set(side*.18,.84,0);walker.add(hip);mesh(legGeo,M.wash,hip,0,-.19,0);const knee=new THREE.Group();knee.position.y=-.38;hip.add(knee);mesh(legGeo,M.ink,knee,0,-.19,0);const ankle=new THREE.Group();ankle.position.y=-.38;knee.add(ankle);mesh(footGeo,M.deep,ankle,0,-.06,.07);legs.push(hip);knees.push(knee);feet.push(ankle)}
// Alternating front panels form a slit; each hem has a deliberate asymmetric contour.
const tails=[];
for(const side of [-1,1]){const p=new THREE.Group();p.position.set(side*.10,1.32,0);walker.add(p);
const n=cloth([[0,0],[side*.21,.03],[side*.41,-.78],[side*.26,-.95],[side*.07,-.88],[-side*.04,-.55]],.28,side<0?M.ink:M.deep,p,0,0,-.12);tails.push(p)}
mesh(new THREE.CylinderGeometry(.24,.30,.67,8),M.ink,walker,0,1.49,0);
cloth([[-.22,.34],[.13,.27],[.25,-.16],[.05,-.25],[-.04,.08]],.025,M.paper,walker,0,1.52,.265);
// Broad pale shoulder silhouette, quiet chest, dark lower mass.
const mantle=cloth([[-.46,0],[-.29,.19],[.22,.17],[.47,-.08],[.35,-.30],[.06,-.21],[-.25,-.32],[-.50,-.17]],.16,M.paper,walker,0,1.83,.13);
cloth([[-.26,.12],[.24,.12],[.36,-.55],[.16,-.64],[-.32,-.46]],.035,M.wash,walker,0,1.77,-.27);
mesh(new THREE.CylinderGeometry(.31,.31,.10,10),M.deep,walker,0,1.29,0);
mesh(new THREE.BoxGeometry(.15,.14,.04),M.red,walker,.11,1.29,.32);
const head=mesh(new THREE.SphereGeometry(.205,10,8),M.paper,walker,0,2.12,0);head.scale.set(.82,1,.85);
mesh(new THREE.SphereGeometry(.21,10,8,0,Math.PI*2,0,Math.PI*.55),M.deep,walker,0,2.18,-.015);
// Matte ink hat with a paper underside; no glowing eyes or metallic bands.
const hatGroup=new THREE.Group();hatGroup.position.y=2.34;hatGroup.rotation.z=-.055;walker.add(hatGroup);
mesh(new THREE.ConeGeometry(.64,.23,16),M.ink,hatGroup,0,.06,0);
mesh(new THREE.ConeGeometry(.61,.02,16),M.paper,hatGroup,0,-.06,0);
const ribs=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;ribs.push(0,.176,0,Math.sin(a)*.62,-.049,Math.cos(a)*.62)}
const ribsGeo=new THREE.BufferGeometry();ribsGeo.setAttribute('position',new THREE.Float32BufferAttribute(ribs,3));hatGroup.add(new THREE.LineSegments(ribsGeo,new THREE.LineBasicMaterial({color:'#738078',transparent:true,opacity:.42})));
const scarfPivot=new THREE.Group();scarfPivot.position.set(0,1.96,.10);walker.add(scarfPivot);
mesh(new THREE.CylinderGeometry(.238,.245,.09,10),M.red,scarfPivot);
cloth([[-.08,0],[.07,-.02],[-.31,-.24],[-.70,-.35],[-.54,-.19]],.025,M.red,scarfPivot,0,0,-.20);
const arms=[];const sleeveGeo=new THREE.CylinderGeometry(.14,.20,.43,7),handGeo=new THREE.SphereGeometry(.09,8,6);
for(const side of [-1,1]){const p=new THREE.Group();p.position.set(side*.34,1.79,0);walker.add(p);mesh(sleeveGeo,M.ink,p,side*.055,-.18,0);mesh(handGeo,M.paper,p,side*.07,-.43,.01);p.rotation.z=side*.16;arms.push(p)}
const weapon=new THREE.Group();weapon.position.set(.08,-.40,.04);weapon.rotation.z=-.40;arms[1].add(weapon);
mesh(new THREE.CylinderGeometry(.028,.035,1.38,6),M.wash,weapon,0,.27,0);
mesh(new THREE.CylinderGeometry(.046,.046,.11,6),M.paper,weapon,0,.98,0);
const tip=mesh(new THREE.ConeGeometry(.085,.32,7),M.deep,weapon,0,1.18,0);tip.rotation.z=-.08;
mesh(new THREE.CylinderGeometry(.047,.047,.055,6),M.red,weapon,0,-.21,0);
let frames=0;const gait=WalkerMotion31.state();let attackWeight=0;
function pose(){
const speed=Math.hypot(STATE.velocityX,STATE.velocityZ),g=WalkerMotion31.update(gait,worldTime,speed,PLAYER.walkSpeed,STATE.grounded,STATE.velocityY);
const total=comboStep===4?.28:.20,t=Math.min(1,Math.max(0,1-attackAnim3D/total)),attack=attackAnim3D>0?Math.sin(Math.PI*t):0;
attackWeight+=(attack-attackWeight)*(1-Math.exp(-g.dt*32));
for(let i=0;i<2;i++){const l=i?g.right:g.left;legs[i].rotation.x=l.hip;knees[i].rotation.x=l.knee;feet[i].rotation.x=l.ankle}
walker.position.y=g.bob-rig.position.y;walker.rotation.x=g.lean-rig.rotation.x;walker.rotation.z=g.roll-rig.rotation.z;
arms[0].rotation.x=-g.arm-.15*(!STATE.grounded);
arms[1].rotation.x=g.arm*.68-attackWeight*1.55;
arms[1].rotation.y=attackAnim3D>0?(-.85+t*1.8)*attackWeight:arms[1].rotation.y*Math.exp(-g.dt*22);
arms[1].rotation.z=-.16-attackWeight*.36;
walker.rotation.y=attackWeight*(-.30+t*.6);
const ease=1-Math.exp(-g.dt*11);
tails[0].rotation.x+=(-g.cloth*.25+Math.sin(g.phase-.65)*g.cloth*.12-tails[0].rotation.x)*ease;
tails[1].rotation.x+=(-g.cloth*.25-Math.sin(g.phase-.65)*g.cloth*.12-tails[1].rotation.x)*ease;
tails[0].rotation.z=.03*g.cloth;tails[1].rotation.z=-.03*g.cloth;
scarfPivot.rotation.x+=(-g.cloth*.40-scarfPivot.rotation.x)*ease;
scarfPivot.rotation.y+=(Math.sin(g.phase-.9)*.15*g.cloth-scarfPivot.rotation.y)*ease;
hatGroup.rotation.x+=(.025+g.cloth*.045-g.roll*.4-hatGroup.rotation.x)*(1-Math.exp(-g.dt*8));frames++;
}
const render=renderer.render;renderer.render=function(s,c){pose();return render.call(this,s,c)};
window.WalkerV3={stats:()=>({frames,originalNodesRetained:originals.length,visualMeshes:walker.children.length,extraAnimationLoops:0,extraListeners:0}),palette:C,gait:()=>({speed:gait.speed,phase:gait.phase,bob:gait.bob,land:gait.land,grounded:gait.grounded,left:{...gait.left},right:{...gait.right}})};
})();

const gait2D31=WalkerMotion31.state();
// Canvas counterpart uses the same silhouette, palette and motion vocabulary.
function drawWalkerV3(ctx,view,px,py,bob,tilt,moving){
const u=view.scale,ink='#202722',paper='#dedfd3',wash='#526058',red='#983d30';
const g=WalkerMotion31.update(gait2D31,worldTime,Math.abs(p2d.vu),PLAYER.walkSpeed,p2d.grounded,p2d.vv);
ctx.save();ctx.translate(px,py-g.bob*u);ctx.scale(p2d.facing*u,u);ctx.rotate(tilt+g.lean*.45);ctx.lineJoin='round';
const step=g.arm,attack=attack2DTimer>0?Math.sin(Math.PI*(1-attack2DTimer/.22)):0;
function shape(points,color){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill()}
function limb(x,y,w,h,color,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.fillRect(-w/2,0,w,h);ctx.restore()}
for(let i=0;i<2;i++){const l=i?g.right:g.left,base=i?.09:-.09;const kx=base-Math.sin(l.hip)*.38,ky=-.84+Math.cos(l.hip)*.38,fx=kx-Math.sin(l.hip+l.knee)*.38,fy=ky+Math.cos(l.hip+l.knee)*.38;ctx.strokeStyle=i?ink:wash;ctx.lineWidth=.15;ctx.beginPath();ctx.moveTo(base,-.84);ctx.lineTo(kx,ky);ctx.lineTo(fx,fy);ctx.stroke();ctx.save();ctx.translate(fx,fy);ctx.rotate(-l.hip-l.knee-l.ankle);shape([[-.09,-.04],[.16,-.04],[.23,.09],[-.10,.09]],ink);ctx.restore()}
shape([[-.24,-1.49],[.24,-1.49],[.49,-.43],[.29,-.27],[.03,-.48],[-.24,-.29],[-.48,-.39]],ink);
shape([[-.17,-1.36],[.07,-1.46],[.21,-.69],[.07,-.49],[-.02,-.73]],wash);
shape([[-.24,-1.87],[.24,-1.87],[.28,-1.33],[-.24,-1.33]],ink);
shape([[-.23,-1.86],[.03,-1.84],[.19,-1.39],[.07,-1.31],[-.08,-1.65]],paper);
shape([[-.28,-1.90],[.23,-1.87],[.47,-1.68],[.31,-1.53],[.03,-1.63],[-.34,-1.52],[-.49,-1.65]],paper);
limb(-.34,-1.70,.23,.46,ink,step*.7+.12);
ctx.save();ctx.translate(.31,-1.69);ctx.rotate(-attack*.95-step*.7);
limb(0,0,.24,.48,ink,-.14);ctx.fillStyle=paper;ctx.fillRect(-.02,.41,.12,.12);
ctx.strokeStyle=wash;ctx.lineWidth=.052;ctx.beginPath();ctx.moveTo(.07,.52);ctx.lineTo(-.31,-.83);ctx.stroke();
shape([[-.36,-.79],[-.25,-.83],[-.39,-1.13]],ink);ctx.fillStyle=red;ctx.fillRect(-.03,.32,.09,.045);ctx.restore();
ctx.fillStyle=paper;ctx.beginPath();ctx.ellipse(.02,-2.06,.17,.20,0,0,Math.PI*2);ctx.fill();
shape([[-.24,-2.18],[.02,-2.30],[.23,-2.18],[.17,-2.10],[-.18,-2.10]],ink);
shape([[-.62,-2.27],[-.02,-2.50],[.61,-2.25],[.33,-2.18],[-.35,-2.18]],ink);
ctx.strokeStyle='#7b867d';ctx.lineWidth=.012;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-.02,-2.47);ctx.lineTo(-.52+i*.20,-2.25);ctx.stroke()}
shape([[-.22,-1.93],[.20,-1.92],[.21,-1.82],[-.20,-1.82]],red);
const flutter=Math.sin(g.phase-.9)*.075*g.cloth;
shape([[-.13,-1.91],[-.40,-1.85],[-.81,-1.76+flutter],[-.63,-1.65+flutter],[-.28,-1.78],[.04,-1.84]],red);
ctx.strokeStyle='#768078';ctx.lineWidth=.018;ctx.beginPath();ctx.moveTo(-.28,-1.04);ctx.lineTo(-.38-step*.08,-.48);ctx.moveTo(.28,-.93);ctx.lineTo(.37+step*.08,-.48);ctx.stroke();
ctx.restore();
}
