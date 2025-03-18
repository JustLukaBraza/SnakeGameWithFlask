const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverScreen = document.querySelector('.game-over');
const finalScoreElement = document.getElementById('finalScore');




let gameSpeed = 100;
let powerUps = { speedBoost: false, shield: false, multiplier: 1 };
let currentLevel = 1;
let foodTypes = [
    { type: 'normal', color: '#ff0055', points: 10 },
    { type: 'golden', color: '#ffd700', points: 50, spawnChance: 0.1 },
    { type: 'poison', color: '#32CD32', points: -20, spawnChance: 0.05 }
];


function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, 600);
    canvas.width = size;
    canvas.height = size;
    CELL_SIZE = size / 20;
}


function spawnFood() {
    const rnd = Math.random();
    let selectedFood = foodTypes[0];

    for (let food of foodTypes) {
        if (food.spawnChance && rnd < food.spawnChance) {
            selectedFood = food;
            break;
        }
    }

    return {
        x: Math.floor(Math.random() * (canvas.width / CELL_SIZE)) * CELL_SIZE,
        y: Math.floor(Math.random() * (canvas.height / CELL_SIZE)) * CELL_SIZE,
        ...selectedFood
    };
}


function activatePowerUp(type) {
    switch(type) {
        case 'speed':
            powerUps.speedBoost = true;
            gameSpeed = 50;
            setTimeout(() => {
                powerUps.speedBoost = false;
                gameSpeed = 100;
            }, 5000);
            break;
            
        case 'shield':
            powerUps.shield = true;
            setTimeout(() => powerUps.shield = false, 8000);
            break;
    }
}


function updateLevel() {
    if (score >= currentLevel * 100) {
        currentLevel++;
        gameSpeed = Math.max(50, 100 - (currentLevel * 5));
    }
}


function drawSnake() {
    const hue = (Date.now() / 10) % 360;
    snake.forEach((seg, index) => {
        ctx.fillStyle = `hsl(${hue + index * 2}, 100%, 50%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = powerUps.shield ? 30 : 15;
        ctx.fillRect(seg.x + 2, seg.y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });
}


function update() {
    const head = {...snake[0]};

    
    switch(direction) {
        case 'up': head.y -= CELL_SIZE; break;
        case 'down': head.y += CELL_SIZE; break;
        case 'left': head.x -= CELL_SIZE; break;
        case 'right': head.x += CELL_SIZE; break;
    }

    
    if ((!powerUps.shield) && (head.x < 0 || head.x >= canvas.width || 
         head.y < 0 || head.y >= canvas.height || 
         snake.some(seg => seg.x === head.x && seg.y === head.y))) {
        gameOver();
        return;
    }

    snake.unshift(head);

    
    if (head.x === food.x && head.y === food.y) {
        score += food.points * powerUps.multiplier;
        scoreElement.textContent = score > 0 ? score : 0;
        
        
        if(food.type === 'golden' && Math.random() < 0.3) activatePowerUp('speed');
        if(food.type === 'poison') snake.pop();
        
        
        updateLevel();
        food = spawnFood();
        
        
        if(Math.random() < 0.15) activatePowerUp(Math.random() < 0.5 ? 'speed' : 'shield');
    } else {
        snake.pop();
    }

    drawGame();
}


function drawHUD() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 150, 80);
    ctx.fillStyle = '#00ff88';
    ctx.font = '14px Arial';
    ctx.fillText(`Level: ${currentLevel}`, 20, 30);
    ctx.fillText(`Multiplier: x${powerUps.multiplier}`, 20, 50);
    ctx.fillText(`Shield: ${powerUps.shield ? 'ON' : 'OFF'}`, 20, 70);
}


function drawGame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = food.color;
    ctx.fillRect(food.x, food.y, CELL_SIZE, CELL_SIZE);

    drawSnake();
    drawHUD();
}





function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, 600);
    canvas.width = size;
    canvas.height = size;
    CELL_SIZE = size / 20;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);


let snake = [{x: CELL_SIZE * 5, y: CELL_SIZE * 5}];
let food = spawnFood();
let direction = 'right';
let score = 0;
let gameLoop;


function spawnFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / CELL_SIZE)) * CELL_SIZE,
        y: Math.floor(Math.random() * (canvas.height / CELL_SIZE)) * CELL_SIZE
    };
}


function drawGame() {
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    snake.forEach((seg, index) => {
        ctx.fillStyle = `hsl(${index * 10}, 100%, 50%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;
        ctx.fillRect(seg.x + 2, seg.y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });

    
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 20;
    ctx.fillRect(food.x, food.y, CELL_SIZE, CELL_SIZE);
}

function gameOver() {
    clearInterval(gameLoop);
    gameOverScreen.style.display = 'block';
    finalScoreElement.textContent = score;
}


document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': if(direction !== 'down') direction = 'up'; break;
        case 'ArrowDown': if(direction !== 'up') direction = 'down'; break;
        case 'ArrowLeft': if(direction !== 'right') direction = 'left'; break;
        case 'ArrowRight': if(direction !== 'left') direction = 'right'; break;
    }
});


document.getElementById('upBtn').addEventListener('click', () => direction = 'up');
document.getElementById('downBtn').addEventListener('click', () => direction = 'down');
document.getElementById('leftBtn').addEventListener('click', () => direction = 'left');
document.getElementById('rightBtn').addEventListener('click', () => direction = 'right');


function update() {
    const head = {...snake[0]};

    switch(direction) {
        case 'up': head.y -= CELL_SIZE; break;
        case 'down': head.y += CELL_SIZE; break;
        case 'left': head.x -= CELL_SIZE; break;
        case 'right': head.x += CELL_SIZE; break;
    }

    
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || 
        snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        food = spawnFood();
    } else {
        snake.pop();
    }

    drawGame();
}


document.getElementById('playAgainBtn').addEventListener('click', () => location.reload());
document.getElementById('restartBtn').addEventListener('click', () => location.reload());


gameLoop = setInterval(update, 100);
