/* =========================================================
   ITAM Survival Mode - game logic (vanilla JS)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const gameOverlay = document.getElementById("gameOverlay");
  const gameArea = document.getElementById("gameArea");
  const player = document.getElementById("player");
  const obstacle = document.getElementById("obstacle");

  const startBtn = document.getElementById("startGameBtn");
  const jumpBtn = document.getElementById("jumpGameBtn");
  const skipBtn = document.getElementById("skipGameBtn");

  const progressValue = document.getElementById("gameProgressValue");
  const progressTarget = document.getElementById("gameProgressTarget");
  const statusMessage = document.getElementById("gameStatusMessage");
  const hearts = Array.from(document.querySelectorAll(".game-lives .heart"));

  if (
    !gameOverlay ||
    !gameArea ||
    !player ||
    !obstacle ||
    !startBtn ||
    !jumpBtn ||
    !skipBtn ||
    !progressValue ||
    !progressTarget ||
    !statusMessage
  ) {
    return;
  }

  const OBSTACLE_TYPES = [
    { key: "task", label: "Tarea acumulada" },
    { key: "professor", label: "Profesor en modo final" },
    { key: "dog", label: "Perro rabioso" },
    { key: "exam", label: "Examen sorpresa" },
  ];

  const TARGET_CLEAR = 7;
  const MAX_LIVES = 3;
  const PLAYER_BASE_Y = 50;
  const OBSTACLE_BASE_Y = 50;
  const BASE_OBSTACLE_SPEED = 300;
  const SPEED_INCREMENT_PER_POINT = 13;
  const MAX_OBSTACLE_SPEED = 390;
  const GRAVITY = 2000;
  const JUMP_VELOCITY = 900;
  const MIN_SPAWN_DELAY_MS = 720;
  const MAX_SPAWN_DELAY_MS = 1180;

  let lives = MAX_LIVES;
  let cleared = 0;
  let isRunning = false;
  let isGameOver = false;
  let jumpVelocity = 0;
  let playerY = PLAYER_BASE_Y;
  let obstacleX = 0;
  let obstacleResolved = false;
  let obstacleActive = false;
  let obstacleSpawnDelayMs = 850;
  let currentObstacle = OBSTACLE_TYPES[0];
  let lastFrame = 0;
  let rafId = null;

  progressTarget.textContent = String(TARGET_CLEAR);

  function setStatus(text) {
    statusMessage.textContent = text;
  }

  function updateLivesUI() {
    hearts.forEach((heart, idx) => {
      heart.style.opacity = idx < lives ? "1" : "0.2";
      heart.style.filter = idx < lives ? "none" : "grayscale(1)";
    });
  }

  function updateProgressUI() {
    progressValue.textContent = String(cleared);
  }

  function setPlayerBottom(px) {
    player.style.bottom = `${px}px`;
  }

  function setObstaclePosition() {
    obstacle.style.right = `${obstacleX}px`;
    obstacle.style.bottom = `${OBSTACLE_BASE_Y}px`;
  }

  function pickObstacleType() {
    const idx = Math.floor(Math.random() * OBSTACLE_TYPES.length);
    currentObstacle = OBSTACLE_TYPES[idx];
  
    obstacle.textContent = "";
    obstacle.className = `game-obstacle game-obstacle-${currentObstacle.key}`;
    obstacle.setAttribute("aria-label", currentObstacle.label);
    obstacle.dataset.type = currentObstacle.key;
  }

  function resetObstacle() {
    pickObstacleType();
    obstacleResolved = false;
    obstacleActive = true;
    obstacleX = -obstacle.offsetWidth;
    obstacle.style.visibility = "visible";
    setObstaclePosition();
  }

  function randomSpawnDelayMs() {
    return (
      MIN_SPAWN_DELAY_MS +
      Math.random() * (MAX_SPAWN_DELAY_MS - MIN_SPAWN_DELAY_MS)
    );
  }

  function queueNextObstacle() {
    obstacleActive = false;
    obstacleSpawnDelayMs = randomSpawnDelayMs();
    obstacle.style.visibility = "hidden";
  }

  function currentObstacleSpeed() {
    return Math.min(
      BASE_OBSTACLE_SPEED + cleared * SPEED_INCREMENT_PER_POINT,
      MAX_OBSTACLE_SPEED
    );
  }

  function resetGameState() {
    lives = MAX_LIVES;
    cleared = 0;
    isRunning = false;
    isGameOver = false;
    jumpVelocity = 0;
    playerY = PLAYER_BASE_Y;
    setPlayerBottom(playerY);
    updateLivesUI();
    updateProgressUI();
    queueNextObstacle();
    startBtn.textContent = "Start";
    setStatus("Bienvenido: presiona Start y demuestra reflejos de semana de parciales.");
  }

  function handleLoss() {
    lives -= 1;
    updateLivesUI();
    if (lives <= 0) {
      isRunning = false;
      isGameOver = true;
      queueNextObstacle();
      startBtn.textContent = "Restart";
      setStatus("Te fuiste a extraordinario. Reinicia y vuelve por tu acceso al portfolio.");
      return;
    }
    setStatus(`${currentObstacle.label} te alcanzó. Respira, ajusta estrategia y sigue: te quedan ${lives} vidas.`);
    queueNextObstacle();
  }

  function handleClearObstacle() {
    cleared += 1;
    updateProgressUI();

    if (cleared >= TARGET_CLEAR) {
      isRunning = false;
      queueNextObstacle();
      startBtn.textContent = "Start";
      setStatus("Aprobado con honores. Acceso concedido: bienvenido a mi portfolio.");
      window.setTimeout(() => {
        gameOverlay.style.display = "none";
      }, 700);
      return;
    }

    setStatus(`Excelente jugada: esquivaste ${currentObstacle.label}. Progreso ${cleared}/${TARGET_CLEAR}.`);
    queueNextObstacle();
  }

  function doJump() {
    if (!isRunning) {
      return;
    }
    if (playerY > PLAYER_BASE_Y + 1) {
      return;
    }
    jumpVelocity = JUMP_VELOCITY;
  }

  function getRect(el) {
    const r = el.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
  }

  function getForgivingHitbox(rect, insetPx) {
    return {
      left: rect.left + insetPx,
      top: rect.top + insetPx,
      right: rect.right - insetPx,
      bottom: rect.bottom - insetPx,
    };
  }

  function intersects(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function gameLoop(ts) {
    if (!lastFrame) {
      lastFrame = ts;
    }
    const dt = Math.min((ts - lastFrame) / 1000, 0.033);
    lastFrame = ts;

    if (isRunning) {
      jumpVelocity -= GRAVITY * dt;
      playerY += jumpVelocity * dt;
      if (playerY < PLAYER_BASE_Y) {
        playerY = PLAYER_BASE_Y;
        jumpVelocity = 0;
      }
      setPlayerBottom(playerY);

      const gameWidth = gameArea.clientWidth;
      const obstacleWidth = obstacle.offsetWidth;
      if (!obstacleActive) {
        obstacleSpawnDelayMs -= dt * 1000;
        if (obstacleSpawnDelayMs <= 0) {
          resetObstacle();
        }
      } else {
        const playerRect = getForgivingHitbox(getRect(player), 9);
        const obstacleRect = getForgivingHitbox(getRect(obstacle), 8);

        obstacleX += currentObstacleSpeed() * dt;
        setObstaclePosition();
        const obstacleExitedLeftSide = obstacleX > gameWidth + obstacleWidth + 8;

        if (!obstacleResolved && intersects(playerRect, obstacleRect)) {
          obstacleResolved = true;
          handleLoss();
        }

        if (!obstacleResolved && obstacleExitedLeftSide) {
          obstacleResolved = true;
          handleClearObstacle();
        }
      }
    }

    rafId = window.requestAnimationFrame(gameLoop);
  }

  function startGame() {
    if (isRunning) {
      return;
    }
    if (isGameOver) {
      resetGameState();
    }
    isRunning = true;
    isGameOver = false;
    startBtn.textContent = "Running...";
    if (!obstacleActive) {
      obstacleSpawnDelayMs = 450;
    }
    setStatus("Inicia la carrera ITAM: timing, enfoque y cero pánico.");
  }

  startBtn.addEventListener("click", () => {
    if (isGameOver) {
      resetGameState();
    }
    startGame();
  });

  jumpBtn.addEventListener("click", doJump);

  skipBtn.addEventListener("click", () => {
    isRunning = false;
    setStatus("Modo directo activado. Entrando al portfolio...");
    gameOverlay.style.display = "none";
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key;
    const overlayVisible = gameOverlay.style.display !== "none";
    if ((key === " " || key === "ArrowUp") && overlayVisible) {
      event.preventDefault();
      doJump();
    }
  });

  resetGameState();
  if (!rafId) {
    rafId = window.requestAnimationFrame(gameLoop);
  }
});
