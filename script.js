const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

const STORAGE_KEY = "chess_rope_positions_v3";

let dragging = null;
let startPointerX = 0;
let startPointerY = 0;
let startLeft = 0;
let startTop = 0;

// cuerda: solo limite, no “resorte”
const maxLength = 500; // cambia esto si quieres más o menos longitud

function getCenter(el) {
  const rect = el.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  return {
    x: rect.left - boardRect.left + rect.width / 2,
    y: rect.top - boardRect.top + rect.height / 2
  };
}

function updateRope() {
  const kc = getCenter(king);
  const qc = getCenter(queen);

  rope.setAttribute("x1", kc.x);
  rope.setAttribute("y1", kc.y);
  rope.setAttribute("x2", qc.x);
  rope.setAttribute("y2", qc.y);
}

function clampToBoard(left, top, el) {
  const boardRect = board.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  let clampedLeft = Math.max(0, Math.min(boardRect.width - width, left));
  let clampedTop = Math.max(0, Math.min(boardRect.height - height, top));

  return { left: clampedLeft, top: clampedTop };
}

// limita SOLO la pieza que se está moviendo si supera maxLength
function enforceMaxDistance(movingPiece) {
  const otherPiece = movingPiece === king ? queen : king;
  const mc = getCenter(movingPiece);
  const oc = getCenter(otherPiece);

  const dx = mc.x - oc.x;
  const dy = mc.y - oc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= maxLength || dist === 0) return;

  const nx = dx / dist;
  const ny = dy / dist;

  // colocamos la pieza movida exactamente en el círculo de radio maxLength
  const newX = oc.x + nx * maxLength;
  const newY = oc.y + ny * maxLength;

  const boardRect = board.getBoundingClientRect();
  const rect = movingPiece.getBoundingClientRect();

  let left = newX - rect.width / 2;
  let top = newY - rect.height / 2;

  const clamped = clampToBoard(left, top, movingPiece);
  movingPiece.style.left = clamped.left + "px";
  movingPiece.style.top = clamped.top + "px";
}

function savePositions() {
  const kingRect = king.getBoundingClientRect();
  const queenRect = queen.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();

  const data = {
    king: {
      left: kingRect.left - boardRect.left,
      top: kingRect.top - boardRect.top
    },
    queen: {
      left: queenRect.left - boardRect.left,
      top: queenRect.top - boardRect.top
    }
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadPositions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    updateRope();
    return;
  }
  try {
    const data = JSON.parse(saved);
    if (data.king && data.queen) {
      king.style.left = data.king.left + "px";
      king.style.top = data.king.top + "px";
      queen.style.left = data.queen.left + "px";
      queen.style.top = data.queen.top + "px";
    }
  } catch (e) {
    console.error("Error al leer posiciones guardadas", e);
  }
  updateRope();
}

// ---------- eventos puntero (ratón + touch) ----------

function getCoords(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function startDrag(e) {
  const target = e.target;
  if (!target.classList.contains("piece")) return;

  e.preventDefault();
  dragging = target;

  const point = getCoords(e);
  const rect = target.getBoundingClientRect();

  startPointerX = point.x;
  startPointerY = point.y;
  startLeft = rect.left;
  startTop = rect.top;

  target.style.cursor = "grabbing";
}

function moveDrag(e) {
  if (!dragging) return;

  e.preventDefault();
  const point = getCoords(e);
  const boardRect = board.getBoundingClientRect();

  const deltaX = point.x - startPointerX;
  const deltaY = point.y - startPointerY;

  let left = startLeft + deltaX - boardRect.left;
  let top = startTop + deltaY - boardRect.top;

  const clamped = clampToBoard(left, top, dragging);
  dragging.style.left = clamped.left + "px";
  dragging.style.top = clamped.top + "px";

  // limitar distancia si supera maxLength, sin mover la otra pieza
  enforceMaxDistance(dragging);
  updateRope();
}

function endDrag(e) {
  if (!dragging) return;
  e.preventDefault();
  dragging.style.cursor = "grab";
  dragging = null;
  savePositions();
}

board.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", moveDrag);
window.addEventListener("mouseup", endDrag);

board.addEventListener("touchstart", startDrag, { passive: false });
window.addEventListener("touchmove", moveDrag, { passive: false });
window.addEventListener("touchend", endDrag, { passive: false });
window.addEventListener("touchcancel", endDrag, { passive: false });

// inicio
window.addEventListener("load", () => {
  loadPositions();
});

// ya no necesitamos física continua; solo dibuja cuerda
