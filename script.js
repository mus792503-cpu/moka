const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 14;
const PADDLE_HEIGHT = 100;
const PADDLE_OFFSET = 30;
const BALL_RADIUS = 9;

const player = {
  x: PADDLE_OFFSET,
  y: (HEIGHT - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  score: 0,
};

const computer = {
  x: WIDTH - PADDLE_OFFSET - PADDLE_WIDTH,
  y: (HEIGHT - PADDLE_HEIGHT) / 2,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  score: 0,
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: BALL_RADIUS,
  vx: 5,
  vy: 3,
};

const pressedKeys = new Set();
let lastTime = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetBall(direction = Math.random() < 0.5 ? -1 : 1) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.vx = 5 * direction;
  ball.vy = (Math.random() * 4 + 1.5) * (Math.random() < 0.5 ? -1 : 1);
}

function restartGame() {
  player.score = 0;
  computer.score = 0;
  player.y = (HEIGHT - PADDLE_HEIGHT) / 2;
  computer.y = (HEIGHT - PADDLE_HEIGHT) / 2;
  resetBall();
}

function movePlayer() {
  if (pressedKeys.has('ArrowUp')) {
    player.y -= 7;
  }
  if (pressedKeys.has('ArrowDown')) {
    player.y += 7;
  }

  player.y = clamp(player.y, 0, HEIGHT - player.height);
}

function updateComputerAI() {
  const computerCenter = computer.y + computer.height / 2;
  const distance = ball.y - computerCenter;
  const maxStep = 4.4;

  if (Math.abs(distance) > 12) {
    computer.y += Math.sign(distance) * Math.min(Math.abs(distance), maxStep);
  }

  computer.y = clamp(computer.y, 0, HEIGHT - computer.height);
}

function paddleCollision(paddle, direction) {
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.height;
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;

  const intersectsHorizontally = ballRight > paddle.x && ballLeft < paddle.x + paddle.width;
  const intersectsVertically = ballBottom > paddleTop && ballTop < paddleBottom;

  if (!intersectsHorizontally || !intersectsVertically) {
    return false;
  }

  const paddleCenter = paddle.y + paddle.height / 2;
  const relativeImpact = (ball.y - paddleCenter) / (paddle.height / 2);
  const bounceAngle = relativeImpact * (Math.PI / 3);
  const speedBoost = Math.min(Math.hypot(ball.vx, ball.vy) + 0.3, 11.5);

  ball.vx = direction * speedBoost * Math.cos(bounceAngle);
  ball.vy = speedBoost * Math.sin(bounceAngle);

  if (direction > 0) {
    ball.x = paddle.x + paddle.width + ball.radius;
  } else {
    ball.x = paddle.x - ball.radius;
  }

  return true;
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.radius >= HEIGHT) {
    ball.y = HEIGHT - ball.radius;
    ball.vy = -Math.abs(ball.vy);
  }

  if (ball.vx < 0 && paddleCollision(player, 1)) {
    return;
  }

  if (ball.vx > 0 && paddleCollision(computer, -1)) {
    return;
  }

  if (ball.x + ball.radius < 0) {
    computer.score += 1;
    resetBall(-1);
  } else if (ball.x - ball.radius > WIDTH) {
    player.score += 1;
    resetBall(1);
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#76e5d3';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = '#ffca6a';
  ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

  ctx.fillStyle = '#edf3ff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#edf3ff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 56px Arial';
  ctx.fillText(player.score, WIDTH / 2 - 70, 70);
  ctx.fillText(computer.score, WIDTH / 2 + 70, 70);
}

function update(dt) {
  const scaled = dt / 16.67;
  movePlayer();
  updateComputerAI();

  ball.x += ball.vx * scaled;
  ball.y += ball.vy * scaled;

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.radius >= HEIGHT) {
    ball.y = HEIGHT - ball.radius;
    ball.vy = -Math.abs(ball.vy);
  }

  const hitLeft = ball.vx < 0 &&
    ball.x - ball.radius <= player.x + player.width &&
    ball.x + ball.radius >= player.x &&
    ball.y + ball.radius >= player.y &&
    ball.y - ball.radius <= player.y + player.height;

  const hitRight = ball.vx > 0 &&
    ball.x + ball.radius >= computer.x &&
    ball.x - ball.radius <= computer.x + computer.width &&
    ball.y + ball.radius >= computer.y &&
    ball.y - ball.radius <= computer.y + computer.height;

  if (hitLeft) {
    const paddleCenter = player.y + player.height / 2;
    const impact = (ball.y - paddleCenter) / (player.height / 2);
    const angle = impact * (Math.PI / 3);
    const speed = Math.min(Math.hypot(ball.vx, ball.vy) + 0.3, 11.5);

    ball.vx = speed * Math.cos(angle);
    ball.vy = speed * Math.sin(angle);
    ball.x = player.x + player.width + ball.radius;
  }

  if (hitRight) {
    const paddleCenter = computer.y + computer.height / 2;
    const impact = (ball.y - paddleCenter) / (computer.height / 2);
    const angle = impact * (Math.PI / 3);
    const speed = Math.min(Math.hypot(ball.vx, ball.vy) + 0.3, 11.5);

    ball.vx = -speed * Math.cos(angle);
    ball.vy = speed * Math.sin(angle);
    ball.x = computer.x - ball.radius;
  }

  if (ball.x + ball.radius < 0) {
    computer.score += 1;
    resetBall(-1);
  } else if (ball.x - ball.radius > WIDTH) {
    player.score += 1;
    resetBall(1);
  }
}

function gameLoop(timestamp) {
  const dt = lastTime ? timestamp - lastTime : 16.67;
  lastTime = timestamp;

  update(dt);
  drawBoard();
  requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const localY = ((event.clientY - rect.top) / rect.height) * HEIGHT;

  player.y = clamp(localY - player.height / 2, 0, HEIGHT - player.height);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    pressedKeys.add(event.key);
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    pressedKeys.delete(event.key);
  }
});

restartBtn.addEventListener('click', restartGame);

restartGame();
requestAnimationFrame(gameLoop);


































































































































































































































































