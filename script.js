const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

const STORAGE_KEY = "chess_rope_positions_v2";

let dragging = null;
let offsetX = 0;
let offsetY = 0;

// CUERDA MÁS FLOJA Y LARGA
const maxLength = 500;   // longitud máxima antes de tensarse
const stiffness = 0.02;  // cuanto menor, más suave

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

  rope.setAttribute("x1", kc.x);
  rope.setAttribute("y1", kc.y);
  rope.setAttribute("x2", qc.x);
  rope.setAttribute("y2", qc.y);

  if (!applyPhysics) return;

  const dx = qc.x - kc.x;
  const dy = qc.y - kc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // SOLO si está más lejos que maxLength aplicamos "tensión"
  if (dist > maxLength) {
    const excess = dist - maxLength;
    const nx = dx / dist;
    const ny = dy / dist;

    const corr = excess * stiffness;

    movePieceByCenter(king, kc.x + nx * corr * 0.5, kc.y + ny * corr * 0.5, true);
    movePieceByCenter(queen, qc.x - nx * corr * 0.5, qc.y - ny * corr * 0.5, true);
  }
}

function movePieceByCenter(el, centerX, centerY, fromPhysics = false) {
  const rect = el.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  let left = centerX - rect.width / 2;
  let top = centerY - rect.height / 2;

  // límites
  left = Math.max(0, Math.min(boardRect.width - rect.width, left));
  top = Math.max(0, Math.min(boardRect.height - rect.height, top));

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  if (!fromPhysics) updateRope(false);
}

// ---------- localStorage ----------

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
    updateRope(false); // solo dibujar cuerda con posiciones por defecto
    return;
  }
  try {
    const data = JSON.parse(saved);
    if (data.king && data.queen) {
      king.style.left = `${data.king.left}px`;
      king.style.top = `${data.king.top}px`;
      queen.style.left = `${data.queen.left}px`;
      queen.style.top = `${data.queen.top}px`;
    }
  } catch (e) {
    console.error("Error al leer posiciones guardadas", e);
  }
  updateRope(false);
}

// ---------- helpers de puntero (ratón + touch) ----------

function getPointFromEvent(e) {
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

  const point = getPointFromEvent(e);
  const rect = target.getBoundingClientRect();

  offsetX = point.x - rect.left;
  offsetY = point.y - rect.top;

  target.style.cursor = "grabbing";
}

function moveDrag(e) {
  if (!dragging) return;

  e.preventDefault();
  const point = getPointFromEvent(e);
  const boardRect = board.getBoundingClientRect();

  let left = point.x - boardRect.left - offsetX;
  let top = point.y - boardRect.top - offsetY;

  left = Math.max(0, Math.min(boardRect.width - dragging.offsetWidth, left));
  top = Math.max(0, Math.min(boardRect.height - dragging.offsetHeight, top));

  dragging.style.left = `${left}px`;
  dragging.style.top = `${top}px`;

  updateRope(false);
}

function endDrag(e) {
  if (!dragging) return;
  e.preventDefault();
  dragging.style.cursor = "grab";
  dragging = null;
  savePositions();
}

// ratón
board.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", moveDrag);
window.addEventListener("mouseup", endDrag);

// táctil
board.addEventListener("touchstart", startDrag, { passive: false });
window.addEventListener("touchmove", moveDrag, { passive: false });
window.addEventListener("touchend", endDrag, { passive: false });
window.addEventListener("touchcancel", endDrag, { passive: false });

// inicio
window.addEventListener("load", () => {
  loadPositions();
});

// animación (tensión solo cuando se pasa de maxLength)
function animate() {
  updateRope(true);
  requestAnimationFrame(animate);
}
animate();
