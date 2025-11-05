const canvas = document.getElementById('gameCanvas');
canvas.width = 400;
canvas.height = 400;
const ctx = canvas.getContext('2d');

const gravity = 0.6;
let gameOver = false;
let powerActive = false;
let powerTimer = 0;

const player = {
  x: 50,
  y: 300,
  width: 40,
  height: 40,
  dy: 0,
  speed: 5,
  jumping: false,
  jumpsLeft: 2,
  color: 'red'
};

let platforms = [{ x: 0, y: 350, width: 400, height: 50 }];
let lastPlatformX = 400;
let lastPlatformY = 350;

let enemies = [];
const enemySize = 30;
const enemySpeed = 1;

let powers = [];
const powerSize = 20;
let lastPowerX = 0;
const minPowerGap = 600;

const minGap = 250;
const maxGap = 350;
const maxRise = 80;
const maxDrop = 120;
const platformMinY = 150;
const platformMaxY = 350;
const platformMinWidth = 100;
const platformMaxWidth = 180;

const keys = { right: false, left: false, up: false };
document.addEventListener('keydown', e => {
  if (['ArrowRight','KeyD'].includes(e.code)) keys.right = true;
  if (['ArrowLeft','KeyA'].includes(e.code)) keys.left = true;
  if (['ArrowUp','KeyW','Space'].includes(e.code)) {
    if (player.jumpsLeft > 0) {
      player.dy = -13;
      player.jumping = true;
      player.jumpsLeft--;
    }
  }
});
document.addEventListener('keyup', e => {
  if (['ArrowRight','KeyD'].includes(e.code)) keys.right = false;
  if (['ArrowLeft','KeyA'].includes(e.code)) keys.left = false;
});

let cameraX = 0;

function generatePlatform() {
  const gap = Math.random() * (maxGap - minGap) + minGap;
  const newX = lastPlatformX + gap;
  let newY = lastPlatformY + (Math.random() * 2 - 1) * maxRise;

  newY = Math.max(platformMinY, Math.min(platformMaxY, newY));
  if (newY < lastPlatformY - maxRise) newY = lastPlatformY - maxRise;
  if (newY > lastPlatformY + maxDrop) newY = lastPlatformY + maxDrop;

  const width = Math.random() * (platformMaxWidth - platformMinWidth) + platformMinWidth;
  const newPlatform = { x: newX, y: newY, width: width, height: 20 };

  platforms.push(newPlatform);
  lastPlatformX = newX;
  lastPlatformY = newY;

  if (Math.random() < 0.3) {
    enemies.push({
      x: newX + width / 2,
      y: newY - enemySize,
      direction: Math.random() < 0.5 ? 1 : -1,
      platformY: newY,
      alive: true
    });
  }

  if (Math.random() < 0.15 && newX - lastPowerX > minPowerGap) {
    powers.push({
      x: newX + Math.random() * (width - powerSize),
      y: newY - powerSize - 5
    });
    lastPowerX = newX;
  }
}

function triggerGameOver() {
  if (gameOver) return;
  gameOver = true;
  document.getElementById('gameOverScreen').style.display = 'flex';
  document.getElementById('retryBtn').onclick = () => {
    document.getElementById('gameOverScreen').style.display = 'none';
    resetGame();
  };
}

function resetGame() {
  player.x = 50;
  player.y = 300;
  player.dy = 0;
  player.jumping = false;
  player.jumpsLeft = 2;
  platforms = [{ x: 0, y: 350, width: 400, height: 50 }];
  enemies = [];
  powers = [];
  lastPlatformX = 400;
  lastPlatformY = 350;
  lastPowerX = 0;
  cameraX = 0;
  gameOver = false;
  powerActive = false;
  powerTimer = 0;
  update();
}

function update() {
  if (gameOver) return;

  if (keys.right) player.x += player.speed;
  if (keys.left) player.x -= player.speed;

  player.dy += gravity;
  player.y += player.dy;

  platforms.forEach(p => {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y + player.height > p.y &&
      player.y + player.height < p.y + p.height + player.dy
    ) {
      player.y = p.y - player.height;
      player.dy = 0;
      player.jumping = false;
      player.jumpsLeft = 2;
    }
  });

  if (player.y > canvas.height + 200) {
    triggerGameOver();
    return;
  }

  enemies.forEach(e => {
    if (!e.alive) return;
    e.x += e.direction * enemySpeed;
    const platform = platforms.find(p => e.y + enemySize >= p.y - 1 && e.x > p.x && e.x < p.x + p.width);
    if (!platform) e.direction *= -1;

    if (
      player.x < e.x + enemySize &&
      player.x + player.width > e.x &&
      player.y < e.y + enemySize &&
      player.y + player.height > e.y
    ) {
      if (powerActive) {
        e.alive = false;
        e.dy = 5;
      } else {
        triggerGameOver();
      }
    }

    if (!e.alive) e.y += 5;
  });

  powers.forEach((p, index) => {
    if (
      player.x < p.x + powerSize &&
      player.x + player.width > p.x &&
      player.y < p.y + powerSize &&
      player.y + player.height > p.y
    ) {
      powerActive = true;
      powerTimer = 15 * 60;
      powers.splice(index, 1);
    }
  });

  if (powerActive) {
    powerTimer--;
    if (powerTimer <= 0) powerActive = false;
  }

  cameraX = player.x - canvas.width / 2 + player.width / 2;
  if (cameraX < 0) cameraX = 0;

  const visibleEnd = cameraX + canvas.width + 300;
  while (lastPlatformX < visibleEnd) generatePlatform();

  platforms = platforms.filter(p => p.x + p.width > cameraX - 800);
  enemies = enemies.filter(e => e.y < canvas.height + 100);
  powers = powers.filter(p => p.y < canvas.height + 50);

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const skyGradient = ctx.createLinearGradient(0,0,0,canvas.height);
  skyGradient.addColorStop(0,'#87CEEB');
  skyGradient.addColorStop(1,'#c0f0ff');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = 'green';
  platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y, p.width, p.height));

  powers.forEach(p => {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(p.x - cameraX + powerSize/2, p.y + powerSize/2, powerSize/2, 0, Math.PI*2);
    ctx.fill();
  });

  enemies.forEach(e => {
    if (!e.alive) return;
    ctx.fillStyle = '#003366';
    ctx.beginPath();
    ctx.moveTo(e.x - cameraX, e.y + enemySize);
    ctx.lineTo(e.x + enemySize/2 - cameraX, e.y);
    ctx.lineTo(e.x + enemySize - cameraX, e.y + enemySize);
    ctx.closePath();
    ctx.fill();
  });

  ctx.fillStyle = powerActive ? 'orange' : player.color;
  ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);
}

// ====== INICIA ======
resetGame();
