const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

let dragging = null;
let offsetX = 0;
let offsetY = 0;

const maxLength = 1000;

// -------- cuerda --------

function getCenter(el) {
  const rect = el.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2
  };
}

function updateRope(applyPhysics = true) {

  const kc = getCenter(king);
  const qc = getCenter(queen);

  const midX = (kc.x + qc.x) / 2;
  const midY = (kc.y + qc.y) / 2;

  const dx = qc.x - kc.x;
  const dy = qc.y - kc.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  const curveAmount = Math.min(100, dist * 0.15);

  const nx = -dy / dist;
  const ny = dx / dist;

  const cx = midX + nx * curveAmount;
  const cy = midY + ny * curveAmount;

  rope.setAttribute("d", `M ${kc.x} ${kc.y} Q ${cx} ${cy} ${qc.x} ${qc.y}`);

  if (!applyPhysics) return;

  if (dragging && dist > maxLength) {

    const otherPiece = dragging === king ? queen : king;
    const otherCenter = getCenter(otherPiece);
    const dragCenter = getCenter(dragging);

    const dxLimit = dragCenter.x - otherCenter.x;
    const dyLimit = dragCenter.y - otherCenter.y;

    const distLimit = Math.sqrt(dxLimit * dxLimit + dyLimit * dyLimit);

    if (distLimit > maxLength) {

      const nxLimit = dxLimit / distLimit;
      const nyLimit = dyLimit / distLimit;

      const newX = otherCenter.x + nxLimit * maxLength;
      const newY = otherCenter.y + nyLimit * maxLength;

      movePieceByCenter(dragging, newX, newY, true);
    }
  }
}

function movePieceByCenter(el, centerX, centerY, fromPhysics = false) {

  const rect = el.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();

  let left = centerX - rect.width / 2;
  let top = centerY - rect.height / 2;

  left = Math.max(0, Math.min(boardRect.width - rect.width, left));
  top = Math.max(0, Math.min(boardRect.height - rect.height, top));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  if (!fromPhysics) updateRope(false);
}

function getPositions() {

  const kingRect = king.getBoundingClientRect();
  const queenRect = queen.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();

  return {
    king: {
      left: kingRect.left - boardRect.left,
      top: kingRect.top - boardRect.top
    },
    queen: {
      left: queenRect.left - boardRect.left,
      top: queenRect.top - boardRect.top
    }
  };
}

function applyPositions(data) {

  if (!data) return;

  king.style.left = data.king.left + "px";
  king.style.top = data.king.top + "px";

  queen.style.left = data.queen.left + "px";
  queen.style.top = data.queen.top + "px";

  king.style.visibility = "visible";
  queen.style.visibility = "visible";

  updateRope(false);
}

// -------- firebase --------

const dbRef = firebaseRef(firebaseDB, "positions");

firebaseOnValue(dbRef, snapshot => {

  const data = snapshot.val();
  console.log("Firebase data:", data);

  if (!data) {

    const initial = getPositions();
    firebaseSet(dbRef, initial);

    applyPositions(initial);

    return;
  }

  if (!dragging) applyPositions(data);

});

// -------- drag --------

function getPoint(e) {
  if (e.touches && e.touches.length) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
  return { x: e.clientX, y: e.clientY };
}

function startDrag(e) {

  const target = e.target;
  if (!target.classList.contains("piece")) return;

  e.preventDefault();

  dragging = target;

  const rect = target.getBoundingClientRect();
  const p = getPoint(e);

  offsetX = p.x - rect.left;
  offsetY = p.y - rect.top;

  target.style.cursor = "grabbing";
}

function moveDrag(e) {

  if (!dragging) return;

  e.preventDefault();

  const p = getPoint(e);
  const boardRect = board.getBoundingClientRect();

  let left = p.x - boardRect.left - offsetX;
  let top = p.y - boardRect.top - offsetY;

  left = Math.max(0, Math.min(boardRect.width - dragging.offsetWidth, left));
  top = Math.max(0, Math.min(boardRect.height - dragging.offsetHeight, top));

  dragging.style.left = left + "px";
  dragging.style.top = top + "px";

  updateRope(false);

  // 🔥 sincronización en tiempo real
  firebaseSet(dbRef, getPositions());
}

function endDrag() {

  if (!dragging) return;

  dragging.style.cursor = "grab";
  dragging = null;

  firebaseSet(dbRef, getPositions());
}

// -------- eventos --------

board.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", moveDrag);
window.addEventListener("mouseup", endDrag);

board.addEventListener("touchstart", startDrag, { passive: false });
window.addEventListener("touchmove", moveDrag, { passive: false });
window.addEventListener("touchend", endDrag);

// -------- animación --------

function animate() {
  updateRope(dragging !== null);
  requestAnimationFrame(animate);
}

animate();
