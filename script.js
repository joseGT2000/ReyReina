const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

// id para localStorage
const STORAGE_KEY = "chess_rope_positions_v1";

let dragging = null;
let offsetX = 0;
let offsetY = 0;

// parámetros "físicos" de la cuerda
const maxLength = 450;   // MÁS larga que antes
const stiffness = 0.03;  // Más baja => más floja

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

  // actualizar la línea del SVG
  rope.setAttribute("x1", kc.x);
  rope.setAttribute("y1", kc.y);
  rope.setAttribute("x2", qc.x);
  rope.setAttribute("y2", qc.y);

  if (!applyPhysics) return;

  // pequeña simulación: SOLO si la distancia supera maxLength
  const dx = qc.x - kc.x;
  const dy = qc.y - kc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

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
  const left = centerX - rect.width / 2;
  const top = centerY - rect.height / 2;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  if (!fromPhysics) {
    updateRope(false);
  }
}

// guardar posiciones en localStorage
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

// cargar posiciones de localStorage
function loadPositions() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    // si no hay nada guardado, solo dibuja la cuerda con posiciones por defecto
    updateRope(false);
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

// drag básico con mouse
function onMouseDown(e) {
  const target = e.target;
  if (!target.classList.contains("piece")) return;

  dragging = target;
  const rect = target.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  target.style.cursor = "grabbing";
}

function onMouseMove(e) {
  if (!dragging) return;

  const boardRect = board.getBoundingClientRect();
  let left = e.clientX - boardRect.left - offsetX;
  let top = e.clientY - boardRect.top - offsetY;

  // límites dentro del tablero
  left = Math.max(0, Math.min(boardRect.width - dragging.offsetWidth, left));
  top = Math.max(0, Math.min(boardRect.height - dragging.offsetHeight, top));

  dragging.style.left = `${left}px`;
  dragging.style.top = `${top}px`;

  updateRope(false);
}

function onMouseUp() {
  if (dragging) {
    dragging.style.cursor = "grab";
    savePositions(); // guardamos cuando soltamos
  }
  dragging = null;
}

board.addEventListener("mousedown", onMouseDown);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);

window.addEventListener("load", () => {
  loadPositions();
});

// animación continua para la cuerda (solo aplica física cuando se estira demasiado)
function animate() {
  updateRope(true);
  requestAnimationFrame(animate);
}
animate();
