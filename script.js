import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_XVwWrgVb7psf9ecREFfVw3qOxbxdVrc",
  authDomain: "reyreina-bb5dd.firebaseapp.com",
  databaseURL: "https://reyreina-bb5dd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "reyreina-bb5dd",
  storageBucket: "reyreina-bb5dd.firebasestorage.app",
  messagingSenderId: "824618035025",
  appId: "1:824618035025:web:eaf8238118e8f5d0a6d570"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db,"positions");

const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

let dragging=null;
let offsetX=0;
let offsetY=0;

const maxLength=1000;

function getCenter(el){

const rect=el.getBoundingClientRect();
const boardRect=board.getBoundingClientRect();

return{
x:rect.left-boardRect.left+rect.width/2,
y:rect.top-boardRect.top+rect.height/2
}

}

function updateRope(applyPhysics=true){

const kc=getCenter(king);
const qc=getCenter(queen);

const midX=(kc.x+qc.x)/2;
const midY=(kc.y+qc.y)/2;

const dx=qc.x-kc.x;
const dy=qc.y-kc.y;

const dist=Math.sqrt(dx*dx+dy*dy)||1;

const curve=Math.min(100,dist*0.15);

const nx=-dy/dist;
const ny=dx/dist;

const cx=midX+nx*curve;
const cy=midY+ny*curve;

rope.setAttribute("d",`M ${kc.x} ${kc.y} Q ${cx} ${cy} ${qc.x} ${qc.y}`);

if(!applyPhysics)return;

if(dragging && dist>maxLength){

const other=dragging===king?queen:king;

const otherC=getCenter(other);
const dragC=getCenter(dragging);

const dxL=dragC.x-otherC.x;
const dyL=dragC.y-otherC.y;

const d=Math.sqrt(dxL*dxL+dyL*dyL);

if(d>maxLength){

const nx=dxL/d;
const ny=dyL/d;

const newX=otherC.x+nx*maxLength;
const newY=otherC.y+ny*maxLength;

movePieceByCenter(dragging,newX,newY,true);

}

}

}

function movePieceByCenter(el,cx,cy,fromPhysics=false){

const rect=el.getBoundingClientRect();
const boardRect=board.getBoundingClientRect();

let left=cx-rect.width/2;
let top=cy-rect.height/2;

left=Math.max(0,Math.min(boardRect.width-rect.width,left));
top=Math.max(0,Math.min(boardRect.height-rect.height,top));

el.style.left=left+"px";
el.style.top=top+"px";

if(!fromPhysics)updateRope(false);

}

function getPositions(){

const k=king.getBoundingClientRect();
const q=queen.getBoundingClientRect();
const b=board.getBoundingClientRect();

return{

king:{
left:k.left-b.left,
top:k.top-b.top
},

queen:{
left:q.left-b.left,
top:q.top-b.top
}

}

}

function applyPositions(data){

if(!data)return;

king.style.left=data.king.left+"px";
king.style.top=data.king.top+"px";

queen.style.left=data.queen.left+"px";
queen.style.top=data.queen.top+"px";

updateRope(false);

}

onValue(dbRef,(snapshot)=>{

const data=snapshot.val();

if(!data){

set(dbRef,getPositions());
return;

}

if(!dragging)applyPositions(data);

});

function getPoint(e){

if(e.touches && e.touches.length){

return{
x:e.touches[0].clientX,
y:e.touches[0].clientY
}

}

return{x:e.clientX,y:e.clientY}

}

function startDrag(e){

const target=e.target;

if(!target.classList.contains("piece"))return;

e.preventDefault();

dragging=target;

const rect=target.getBoundingClientRect();
const p=getPoint(e);

offsetX=p.x-rect.left;
offsetY=p.y-rect.top;

target.style.cursor="grabbing";

}

function moveDrag(e){

if(!dragging)return;

e.preventDefault();

const p=getPoint(e);
const boardRect=board.getBoundingClientRect();

let left=p.x-boardRect.left-offsetX;
let top=p.y-boardRect.top-offsetY;

left=Math.max(0,Math.min(boardRect.width-dragging.offsetWidth,left));
top=Math.max(0,Math.min(boardRect.height-dragging.offsetHeight,top));

dragging.style.left=left+"px";
dragging.style.top=top+"px";

updateRope(false);

}

function endDrag(){

if(!dragging)return;

dragging.style.cursor="grab";
dragging=null;

set(dbRef,getPositions());

}

board.addEventListener("mousedown",startDrag);
window.addEventListener("mousemove",moveDrag);
window.addEventListener("mouseup",endDrag);

board.addEventListener("touchstart",startDrag,{passive:false});
window.addEventListener("touchmove",moveDrag,{passive:false});
window.addEventListener("touchend",endDrag);

function animate(){

updateRope(dragging!==null);
requestAnimationFrame(animate);

}

animate();
