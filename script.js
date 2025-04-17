document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const messageOverlay = document.getElementById('messageOverlay');
    const messageText = document.getElementById('messageText');

    // --- Button References ---
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnStart = document.getElementById('btnStart');
    const btnPause = document.getElementById('btnPause');
    const btnRestart = document.getElementById('btnRestart');

    // --- Settings References Removed ---

    // --- Game Constants and Variables ---
    const TILE_SIZE = 20;
    let GRID_WIDTH;
    let GRID_HEIGHT;

    let snake;
    let food;
    let dx, dy;
    let score;
    let changingDirection;
    let gameRenderLoopId = null;
    let gameLogicIntervalId = null;
    let gameState = 'initial';
    // Set game logic speed (milliseconds between snake movements)
    // Lower is faster. 120ms is a reasonably classic feel.
    const GAME_SPEED_MS = 120;

    // --- Rendering Control Variables Removed (targetFps, targetRenderInterval, lastRenderTime) ---

    // --- Utility Functions ---
    function randomCoord(max) { return Math.floor(Math.random() * max); }

    // --- Game State Management ---
    function setGameState(newState) {
        gameState = newState;
        messageOverlay.classList.remove('visible');

        // Simplified - no settings button to disable/enable
        switch (gameState) {
            case 'initial':
                messageText.textContent = 'Press Start';
                messageOverlay.classList.add('visible');
                btnStart.disabled = false;
                btnPause.disabled = true;
                btnRestart.disabled = true;
                btnStart.textContent = 'Start';
                stopGameLogic();
                if (!gameRenderLoopId) drawGame();
                break;
            case 'running':
                btnStart.disabled = true;
                btnPause.disabled = false;
                btnRestart.disabled = true;
                startGameLogic();
                startRenderingLoop();
                break;
            case 'paused':
                messageText.textContent = 'Paused';
                messageOverlay.classList.add('visible');
                btnStart.disabled = false;
                btnStart.textContent = 'Resume';
                btnPause.disabled = true;
                btnRestart.disabled = false;
                stopGameLogic();
                if (!gameRenderLoopId) startRenderingLoop();
                break;
            case 'gameOver':
                messageText.textContent = `Game Over! Score: ${score}`;
                messageOverlay.classList.add('visible');
                btnStart.disabled = true;
                btnPause.disabled = true;
                btnRestart.disabled = false;
                btnStart.textContent = 'Start';
                stopGameLogic();
                if (!gameRenderLoopId) startRenderingLoop();
                break;
        }
    }

    function startGameLogic() {
        if (gameLogicIntervalId) return;
        gameLogicIntervalId = setInterval(() => {
            if (gameState === 'running') {
                advanceGame();
                changingDirection = false;
            }
        }, GAME_SPEED_MS); // Use the classic speed constant
    }

    function stopGameLogic() {
        if (gameLogicIntervalId) {
            clearInterval(gameLogicIntervalId);
            gameLogicIntervalId = null;
        }
    }

    // --- Simplified Rendering Loop Control ---
    function startRenderingLoop() {
        if (gameRenderLoopId) return; // Already running

        function renderLoop() {
            // No FPS limiting, just draw every frame
            drawGame();
            // Continue the loop
            gameRenderLoopId = requestAnimationFrame(renderLoop);
        }
        // Start the loop
        gameRenderLoopId = requestAnimationFrame(renderLoop);
    }

    function stopRenderingLoop() {
       // We generally don't stop rendering, maybe only if absolutely necessary
       // If needed: if (gameRenderLoopId) { cancelAnimationFrame(gameRenderLoopId); gameRenderLoopId = null; }
    }


    // --- Game Setup & Reset ---
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
        GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);
        if (gameState !== 'initial' || !gameRenderLoopId) {
             drawGame();
        }
    }

    function resetGame() {
        stopGameLogic();
        // Ensure rendering loop is running to show reset state
        if (!gameRenderLoopId) startRenderingLoop();

        const startX = Math.floor(GRID_WIDTH / 2);
        const startY = Math.floor(GRID_HEIGHT / 2);
        snake = [ { x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY } ];
        dx = 1; dy = 0; score = 0; scoreElement.textContent = score;
        createFood();
        changingDirection = false;
        setGameState('initial');
        drawGame(); // Initial draw
    }

    // --- Core Game Logic (Keep advanceGame, isGameOver as is) ---
    function advanceGame() {
        if (isGameOver()) { setGameState('gameOver'); return; }
        let newHeadX = snake[0].x + dx; let newHeadY = snake[0].y + dy;
        if (newHeadX < 0) newHeadX = GRID_WIDTH - 1; else if (newHeadX >= GRID_WIDTH) newHeadX = 0;
        if (newHeadY < 0) newHeadY = GRID_HEIGHT - 1; else if (newHeadY >= GRID_HEIGHT) newHeadY = 0;
        const head = { x: newHeadX, y: newHeadY }; snake.unshift(head);
        const didEatFood = head.x === food.x && head.y === food.y;
        if (didEatFood) { score += 10; scoreElement.textContent = score; createFood(); } else { snake.pop(); }
    }
    function isGameOver() {
        if (!snake || snake.length < 1) return false;
        for (let i = 1; i < snake.length; i++) { if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true; } return false;
    }

    // --- Drawing Functions (Keep drawGame, drawSnake, drawFood as is) ---
     function drawGame() {
        ctx.fillStyle = getComputedStyle(canvas).backgroundColor || '#20232a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawFood();
        drawSnake();
    }
    function drawSnake() {
        if (!snake || snake.length === 0) return;
        const bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-body-color').trim() || '#98c379';
        const headColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-head-color').trim() || '#ffffff';
        const lineWidth = TILE_SIZE * 0.8;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lineWidth;
        ctx.beginPath(); ctx.moveTo( snake[0].x * TILE_SIZE + TILE_SIZE / 2, snake[0].y * TILE_SIZE + TILE_SIZE / 2 );
        for (let i = 1; i < snake.length; i++) {
            const current = snake[i], prev = snake[i - 1];
            const wrapX = Math.abs(current.x - prev.x) > 1, wrapY = Math.abs(current.y - prev.y) > 1;
            if (wrapX || wrapY) { ctx.strokeStyle = bodyColor; ctx.stroke(); ctx.beginPath(); ctx.moveTo( current.x * TILE_SIZE + TILE_SIZE / 2, current.y * TILE_SIZE + TILE_SIZE / 2 ); }
            else { ctx.lineTo( current.x * TILE_SIZE + TILE_SIZE / 2, current.y * TILE_SIZE + TILE_SIZE / 2 ); }
        }
        ctx.strokeStyle = bodyColor; ctx.stroke();
        const head = snake[0]; ctx.fillStyle = headColor; ctx.beginPath(); ctx.arc( head.x * TILE_SIZE + TILE_SIZE / 2, head.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.5, 0, Math.PI * 2 ); ctx.fill();
        const eyeSize = TILE_SIZE * 0.1, eyeOffsetX = dx * TILE_SIZE * 0.2, eyeOffsetY = dy * TILE_SIZE * 0.2;
        const headCenterX = head.x * TILE_SIZE + TILE_SIZE / 2, headCenterY = head.y * TILE_SIZE + TILE_SIZE / 2;
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc( headCenterX + eyeOffsetX - dy * TILE_SIZE * 0.15, headCenterY + eyeOffsetY + dx * TILE_SIZE * 0.15, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc( headCenterX + eyeOffsetX + dy * TILE_SIZE * 0.15, headCenterY + eyeOffsetY - dx * TILE_SIZE * 0.15, eyeSize, 0, Math.PI * 2); ctx.fill();
    }
     function drawFood() {
         if (!food) return;
        const foodColor = getComputedStyle(document.documentElement).getPropertyValue('--food-color').trim() || '#e06c75';
        ctx.fillStyle = foodColor; ctx.beginPath(); ctx.arc( food.x * TILE_SIZE + TILE_SIZE / 2, food.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.4, 0, Math.PI * 2 ); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.beginPath(); ctx.arc( food.x * TILE_SIZE + TILE_SIZE * 0.35, food.y * TILE_SIZE + TILE_SIZE * 0.35, TILE_SIZE * 0.15, 0, Math.PI * 2 ); ctx.fill();
    }

    // --- Food Creation (Keep as is) ---
    function createFood() {
         if (!snake) return; let foodX, foodY, collision; do { collision = false; foodX = randomCoord(GRID_WIDTH); foodY = randomCoord(GRID_HEIGHT); for (const part of snake) { if (part.x === foodX && part.y === foodY) { collision = true; break; } } } while (collision); food = { x: foodX, y: foodY };
    }

    // --- Input Handling (Keep as is) ---
    function handleDirectionInput(newDx, newDy) {
        if (changingDirection || gameState !== 'running') return; const goingUp = dy === -1, goingDown = dy === 1, goingRight = dx === 1, goingLeft = dx === -1; if ((newDx === -1 && goingRight) || (newDx === 1 && goingLeft) || (newDy === -1 && goingDown) || (newDy === 1 && goingUp)) return; dx = newDx; dy = newDy; changingDirection = true;
    }

    // --- Settings Modal Logic Removed ---

    // --- Event Listeners ---
    // D-Pad
    btnUp.addEventListener('click', () => handleDirectionInput(0, -1)); btnDown.addEventListener('click', () => handleDirectionInput(0, 1)); btnLeft.addEventListener('click', () => handleDirectionInput(-1, 0)); btnRight.addEventListener('click', () => handleDirectionInput(1, 0));
    // Action Buttons
    btnStart.addEventListener('click', () => { if (gameState === 'initial' || gameState === 'paused') setGameState('running'); }); btnPause.addEventListener('click', () => { if (gameState === 'running') setGameState('paused'); }); btnRestart.addEventListener('click', resetGame);
    // Settings Listeners Removed
    // Keyboard controls
     document.addEventListener('keydown', (e) => {
         // Ignore input if modal *were* visible (good practice even if modal removed now)
         // if (settingsModal.classList.contains('visible')) return;
         switch (e.key) {
             case 'ArrowUp':    handleDirectionInput(0, -1); break;
             case 'ArrowDown':  handleDirectionInput(0, 1);  break;
             case 'ArrowLeft':  handleDirectionInput(-1, 0); break;
             case 'ArrowRight': handleDirectionInput(1, 0); break;
             case ' ': if (gameState === 'running') btnPause.click(); else btnStart.click(); e.preventDefault(); break;
             case 'r': case 'R': btnRestart.click(); break;
         }
     });

    // --- Initial Setup ---
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    resetGame();

}); // End DOMContentLoaded
