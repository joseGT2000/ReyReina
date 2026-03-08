const king = document.getElementById("king");
const queen = document.getElementById("queen");
const rope = document.getElementById("rope");
const board = document.getElementById("board");

const STORAGE_KEY = "chess_rope_positions_v1";

let dragging = null;
let offsetX = 0;
let offsetY = 0;

// física de la cuerda
const maxLength = 450;
const ropeSlack = 300;   // longitud natural (NO tensa)
const stiffness = 0.03;

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

  const dx = qc.x - kc.x;
  const dy = qc.y - kc.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // -------- VISUAL --------

  if (dist < ropeSlack) {
    // cuerda floja (curva)
    const midX = (kc.x + qc.x) / 2;
    const midY = (kc.y + qc.y) / 2 + 60; // caída de la cuerda

    const path = `M ${kc.x} ${kc.y} Q ${midX} ${midY} ${qc.x} ${qc.y}`;
    rope.setAttribute("d", path);

  } else {
    // cuerda tensa
    const path = `M ${kc.x} ${kc.y} L ${qc.x} ${qc.y}`;
    rope.setAttribute("d", path);
  }

  if (!applyPhysics) return;

  // -------- FÍSICA --------

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

  const left = centerX - rect.width / 2;
  const top = centerY - rect.height / 2;

  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  if (!fromPhysics) {
    updateRope(false);
  }
}
