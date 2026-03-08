const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

let dragging = null;
let offsetX = 0;
let offsetY = 0;

// parámetros "físicos" de la cuerda
const maxLength = 300;     // longitud máxima permitida (px)
const stiffness = 0.05;    // rigidez: cuánto corrige cuando se estira

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

  // actualizar la línea del SVG
  rope.setAttribute("x1", kc.x);
  rope.setAttribute("y1", kc.y);
  rope.setAttribute("x2", qc.x);
  rope.setAttribute("y2", qc.y);

  // pequeña simulación: si la distancia supera maxLength, acercamos las piezas
  const dx = qc.x - kc.x;
  const dy = qc.y - kc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > maxLength) {
    const excess = dist - maxLength;
    const nx = dx / dist;
    const ny = dy / dist;

    // desplazamiento que aplicamos a cada pieza (mitad a cada una)
    const corr = excess * stiffness;

    movePiece(king, kc.x + nx * corr * 0.5, kc.y + ny * corr * 0.5, true);
    movePiece(queen, qc.x - nx * corr * 0.5, qc.y - ny * corr * 0.5, true);
  }
}

function movePiece(el, centerX, centerY, fromPhysics = false) {
  const rect = el.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  const left = centerX - rect.width / 2;
  const top = centerY - rect.height / 2;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  // si arrastramos, no actualizamos cuerda aquí para evitar doble cálculo
  if (!fromPhysics) {
    updateRope();
  }
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

  updateRope();
}

function onMouseUp() {
  if (dragging) {
    dragging.style.cursor = "grab";
  }
  dragging = null;
}

board.addEventListener("mousedown", onMouseDown);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("mouseup", onMouseUp);

// animación continua para la cuerda
function animate() {
  updateRope();
  requestAnimationFrame(animate);
}
animate();
