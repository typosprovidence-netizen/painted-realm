/* Pure display gait: no game state writes, timers, input handlers or resources per update. */
(function(){
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
function leg(){return{z:0,y:.15,hip:0,knee:0,ankle:0,support:true}}
function state(){return{time:null,phase:0,speed:0,bob:0,lean:0,roll:0,land:0,grounded:true,left:leg(),right:leg(),arm:0,cloth:0,dt:0}}
function solve(l,z,y,body){l.z=z;l.y=y;const dy=y-.84-body,d=clamp(Math.hypot(z,dy),.12,.759),bend=Math.acos(d/.76);l.hip=Math.atan2(-z,-dy)-bend;l.knee=2*bend;l.ankle=-l.hip-l.knee;}
function update(s,time,velocity,walkSpeed,grounded,vertical){
const dt=s.time===null?0:clamp(time-s.time,0,.05);s.time=time;s.dt=dt;
const target=clamp(velocity/walkSpeed,0,1.4),ease=1-Math.exp(-dt*(target>s.speed?12:16));s.speed=lerp(s.speed,target,ease);
if(s.speed<.003)s.speed=0;
if(grounded&&!s.grounded)s.land=1;s.grounded=grounded;s.land*=Math.exp(-dt*15);
if(grounded)s.phase=(s.phase+dt*(8+velocity*.9)*Math.min(1,s.speed*2))%TAU;
const a=Math.min(1,s.speed),wave=Math.sin(s.phase);s.bob=grounded?(-.018+.035*Math.abs(wave))*a-.035*s.land:0;
s.lean=grounded?.11*a:clamp(-vertical*.012,-.08,.10);s.roll=grounded?wave*.028*a:0;s.arm=wave*.43*a;s.cloth=a;
for(let i=0;i<2;i++){const l=i?s.right:s.left,p=(s.phase/TAU+i*.5)%1;
if(!grounded){l.support=false;solve(l,i?-.14:.22,i?.27:.39,0);continue}
l.support=p<.60;let z,y;
if(l.support){z=.31*(1-2*p/.60);y=.15}else{const t=(p-.60)/.40;z=-.31+.62*t*t*(3-2*t);y=.15+.19*Math.sin(Math.PI*t)}
solve(l,z*a,lerp(.15,y,a),s.bob);
// Small heel lead at contact and toe release, returning to neutral through the swing.
l.ankle+=(l.support?Math.sin(p/.60*Math.PI*2)*.10:Math.sin((p-.60)/.40*Math.PI)*.12)*a;
}
return s;
}
window.WalkerMotion31={state,update};
})();
