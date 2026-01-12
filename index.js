const BOARD_SIZE = 10;
const NUM_MINES = 10;

const cont = document.getElementById("cont");
const newGameBtn = document.getElementById("newGame");
const timeEl = document.getElementById("time");

let gameOver = false;
let firstClick = true;
let board = [];
let mineLocations = [];
let timerId = null;
let startTime = 0;

const pad2 = (n) => String(n).padStart(2, "0");

const formatTime = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${pad2(m)}:${pad2(s)}:${pad2(c)}`;
};

const setTime = (ms) => {
  timeEl.textContent = "Time: " + formatTime(ms);
};

const stopTimer = () => {
  if (timerId) clearInterval(timerId);
  timerId = null;
};

const startTimer = () => {
  startTime = Date.now();
  stopTimer();
  timerId = setInterval(() => setTime(Date.now() - startTime), 10);
};

const inBounds = (r, c) =>
  r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

const neighbors = (r, c) => {
  const out = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc)) out.push([nr, nc]);
    }
  }
  return out;
};

const createCell = (r, c) => {
  const el = document.createElement("div");
  el.className = "cell";
  el.dataset.r = r;
  el.dataset.c = c;

  const cell = {
    isMine: false,
    isRevealed: false,
    count: 0,
    el,
  };

  el.addEventListener("click", () => revealCell(r, c));
  el.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (gameOver || cell.isRevealed) return;
    el.textContent = el.textContent === "🚩" ? "" : "🚩";
  });

  return cell;
};

const createBoard = () => {
  board = [];
  mineLocations = [];
  cont.innerHTML = "";

  for (let r = 0; r < BOARD_SIZE; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "row";

    const row = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = createCell(r, c);
      row.push(cell);
      rowEl.appendChild(cell.el);
    }
    board.push(row);
    cont.appendChild(rowEl);
  }
};

const placeMinesAvoiding = (fr, fc) => {
  mineLocations = [];
  let placed = 0;

  while (placed < NUM_MINES) {
    const r = Math.floor(Math.random() * BOARD_SIZE);
    const c = Math.floor(Math.random() * BOARD_SIZE);

    if ((r === fr && c === fc) || board[r][c].isMine) continue;

    board[r][c].isMine = true;
    mineLocations.push({ row: r, col: c });
    placed++;
  }
};

const computeCounts = () => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell.isMine) {
        cell.count = -1;
        continue;
      }
      let n = 0;
      for (const [nr, nc] of neighbors(r, c)) if (board[nr][nc].isMine) n++;
      cell.count = n;
    }
  }
};

const revealMineCell = (cell) => {
  cell.isRevealed = true;
  cell.el.classList.add("revealed", "mine");
  cell.el.textContent = "💣";
  cell.el.style.pointerEvents = "none";
};

const revealNumberCell = (cell) => {
  cell.isRevealed = true;
  cell.el.classList.add("revealed");
  cell.el.style.pointerEvents = "none";
  if (cell.count > 0) cell.el.textContent = String(cell.count);
};

const revealAllMines = () => {
  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine) revealMineCell(cell);
    }
  }
};

const checkWin = () => {
  let revealed = 0;
  const target = BOARD_SIZE * BOARD_SIZE - NUM_MINES;

  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && cell.isRevealed) revealed++;
    }
  }
  return revealed === target;
};

const floodReveal = (sr, sc) => {
  const q = [[sr, sc]];
  let i = 0;

  while (i < q.length) {
    const [r, c] = q[i++];
    const cell = board[r][c];

    if (cell.isRevealed) continue;
    if (cell.el.textContent === "🚩") continue;

    revealNumberCell(cell);

    if (cell.count !== 0) continue;

    for (const [nr, nc] of neighbors(r, c)) {
      const ncell = board[nr][nc];
      if (!ncell.isMine && !ncell.isRevealed) q.push([nr, nc]);
    }
  }
};

const revealCell = (r, c) => {
  const cell = board[r][c];
  if (gameOver || cell.isRevealed) return;
  if (cell.el.textContent === "🚩") return;

  if (firstClick) {
    placeMinesAvoiding(r, c);
    computeCounts();
    firstClick = false;
    startTimer();
  }

  if (cell.isMine) {
    gameOver = true;
    stopTimer();
    revealAllMines();
    setTimeout(() => alert("Game Over!"), 60);
    return;
  }

  floodReveal(r, c);

  if (checkWin()) {
    gameOver = true;
    stopTimer();
    setTimeout(() => alert("You Win! 🎉"), 60);
  }
};

const newGame = () => {
  gameOver = false;
  firstClick = true;
  stopTimer();
  setTime(0);
  createBoard();
};

newGameBtn.addEventListener("click", newGame);

setTime(0);
createBoard();
