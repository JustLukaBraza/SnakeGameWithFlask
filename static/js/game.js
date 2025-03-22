const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverScreen = document.querySelector('.game-over');
const pauseMenu = document.querySelector('.pause-menu');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');
const finalComboElement = document.getElementById('finalCombo');


const CELL_SIZE = 20;
const GRID_SIZE = 20;
let gameSpeed = 100;
let powerUps = { 
    speedBoost: false, 
    shield: false, 
    multiplier: 1,
    ghost: false,
    magnet: false,
    rainbow: false,
    timeFreeze: false,
    doublePoints: false
};
let currentLevel = 1;
let combo = 0;
let maxCombo = 0;
let particles = [];
let isPaused = false;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let touchStartX = 0;
let touchStartY = 0;


let foodTypes = [
    { type: 'normal', color: '#ff0055', points: 10, spawnChance: 0.6 },
    { type: 'golden', color: '#ffd700', points: 50, spawnChance: 0.1, effect: 'speed' },
    { type: 'poison', color: '#32CD32', points: -20, spawnChance: 0.05, effect: 'shrink' },
    { type: 'rainbow', color: '#ff00ff', points: 100, spawnChance: 0.02, effect: 'ghost' },
    { type: 'bonus', color: '#00ffff', points: 200, spawnChance: 0.01, effect: 'bonus' },
    { type: 'magnet', color: '#4169E1', points: 30, spawnChance: 0.05, effect: 'magnet' },
    { type: 'timeFreeze', color: '#87CEEB', points: 40, spawnChance: 0.03, effect: 'timeFreeze' },
    { type: 'doublePoints', color: '#FFA500', points: 60, spawnChance: 0.02, effect: 'doublePoints' }
];


let achievements = {
    speedRunner: false,
    comboMaster: false,
    survivor: false,
    collector: false,
    perfectGame: false
};

let gameStats = {
    totalFoodEaten: 0,
    specialFoodEaten: 0,
    maxSpeed: 0,
    perfectGames: 0,
    totalPlayTime: 0
};


let snake = [{x: CELL_SIZE * 5, y: CELL_SIZE * 5}];
let food = spawnFood();
let direction = 'right';
let score = 0;
let gameLoop;
let lastFoodTime = Date.now();
let powerUpTimers = {};


class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.size = Math.random() * 4 + 2;
        this.speedX = Math.random() * 8 - 4;
        this.speedY = Math.random() * 8 - 4;
        this.life = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.gravity = 0.1;
        this.alpha = 1;
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.life -= 0.02;
        this.rotation += this.rotationSpeed;
        this.alpha = this.life;
    }

    draw() {
        ctx.save();
        
        
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size;
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.stroke();
        }

        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        
        switch(this.type) {
            case 'star':
                this.drawStar(0, 0, this.size, this.size/2, 5);
                break;
            case 'sparkle':
                this.drawSparkle(0, 0, this.size);
                break;
            default:
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        }
        
        ctx.restore();
    }

    drawStar(x, y, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const px = x + radius * Math.sin(angle);
            const py = y - radius * Math.cos(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawSparkle(x, y, size) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function createTrailParticles(x, y, color) {
    if (Math.random() < 0.3) { 
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.life > 0;
    });
}

function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, 600);
    canvas.width = size;
    canvas.height = size;
    CELL_SIZE = size / GRID_SIZE;
}

function spawnFood() {
    const rnd = Math.random();
    let selectedFood = foodTypes[0];
    let totalChance = 0;

    for (let food of foodTypes) {
        totalChance += food.spawnChance;
        if (rnd < totalChance) {
            selectedFood = food;
            break;
        }
    }

    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / CELL_SIZE)) * CELL_SIZE,
            y: Math.floor(Math.random() * (canvas.height / CELL_SIZE)) * CELL_SIZE,
            ...selectedFood
        };
    } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));

    return newFood;
}

function activatePowerUp(type) {
    if (powerUpTimers[type]) {
        clearTimeout(powerUpTimers[type]);
    }

    const powerUpElement = document.getElementById(type);
    if (powerUpElement) {
        powerUpElement.classList.add('active');
        updatePowerUpTimer(type, getPowerUpDuration(type));
    }

    switch(type) {
        case 'speed':
            powerUps.speedBoost = true;
            gameSpeed = 50;
            powerUpTimers.speed = setTimeout(() => {
                powerUps.speedBoost = false;
                gameSpeed = 100;
                powerUpElement?.classList.remove('active');
            }, 5000);
            break;
            
        case 'shield':
            powerUps.shield = true;
            powerUpTimers.shield = setTimeout(() => {
                powerUps.shield = false;
                powerUpElement?.classList.remove('active');
            }, 8000);
            break;

        case 'ghost':
            powerUps.ghost = true;
            powerUpTimers.ghost = setTimeout(() => {
                powerUps.ghost = false;
                powerUpElement?.classList.remove('active');
            }, 10000);
            break;

        case 'magnet':
            powerUps.magnet = true;
            powerUpTimers.magnet = setTimeout(() => {
                powerUps.magnet = false;
                powerUpElement?.classList.remove('active');
            }, 12000);
            break;

        case 'timeFreeze':
            powerUps.timeFreeze = true;
            const originalSpeed = gameSpeed;
            gameSpeed = 0;
            powerUpTimers.timeFreeze = setTimeout(() => {
                powerUps.timeFreeze = false;
                gameSpeed = originalSpeed;
                powerUpElement?.classList.remove('active');
            }, 5000);
            break;

        case 'doublePoints':
            powerUps.doublePoints = true;
            powerUpTimers.doublePoints = setTimeout(() => {
                powerUps.doublePoints = false;
                powerUpElement?.classList.remove('active');
            }, 15000);
            break;

        case 'bonus':
            powerUps.multiplier *= 2;
            setTimeout(() => {
                powerUps.multiplier /= 2;
            }, 15000);
            break;
    }
}

function getPowerUpDuration(type) {
    const durations = {
        speed: 5,
        shield: 8,
        ghost: 10,
        magnet: 12,
        timeFreeze: 5,
        doublePoints: 15
    };
    return durations[type] || 5;
}

function updatePowerUpTimer(type, duration) {
    const element = document.getElementById(type);
    if (!element) return;

    const timer = element.querySelector('.timer');
    let timeLeft = duration;

    const interval = setInterval(() => {
        timeLeft--;
        timer.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(interval);
            timer.textContent = '';
        }
    }, 1000);
}

function updateLevel() {
    if (score >= currentLevel * 100) {
        currentLevel++;
        gameSpeed = Math.max(50, 100 - (currentLevel * 5));
        createParticles(canvas.width/2, canvas.height/2, '#00ff88', 50);
    }
}

function drawSnake() {
    const hue = (Date.now() / 10) % 360;
    snake.forEach((seg, index) => {
        if (powerUps.ghost && index > 0) {
            ctx.globalAlpha = 0.5;
        } else {
            ctx.globalAlpha = 1;
        }
        
        
        if (index === 0) {
            createTrailParticles(seg.x + CELL_SIZE/2, seg.y + CELL_SIZE/2, `hsl(${hue + index * 2}, 100%, 50%)`);
        }
        
        ctx.fillStyle = `hsl(${hue + index * 2}, 100%, 50%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = powerUps.shield ? 30 : 15;
        
        
        ctx.beginPath();
        ctx.roundRect(seg.x + 2, seg.y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 5);
        ctx.fill();
        
        
        if (index === 0) { 
            ctx.shadowBlur = powerUps.shield ? 40 : 20;
            ctx.fillStyle = `hsl(${hue + index * 2}, 100%, 60%)`;
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
}

function drawFood() {
    ctx.shadowColor = food.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = food.color;
    
    
    const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
    ctx.globalAlpha = pulse;
    
    
    ctx.beginPath();
    ctx.roundRect(food.x, food.y, CELL_SIZE, CELL_SIZE, 5);
    ctx.fill();
    
    
    if (food.type !== 'normal') {
        ctx.shadowBlur = 30;
        ctx.fillStyle = food.color;
        ctx.fill();
    }
    
    ctx.globalAlpha = 1;
}

function drawHUD() {
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 150, 100, 10);
    ctx.fill();
    
    
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 14px Arial';
    ctx.textShadow = '0 0 5px #00ff88';
    
    
    const pulse = Math.sin(Date.now() / 500) * 0.1 + 0.9;
    ctx.globalAlpha = pulse;
    
    ctx.fillText(`Level: ${currentLevel}`, 20, 30);
    ctx.fillText(`Multiplier: x${powerUps.multiplier}`, 20, 50);
    ctx.fillText(`Combo: ${combo}`, 20, 70);
    ctx.fillText(`Max Combo: ${maxCombo}`, 20, 90);
    
    ctx.globalAlpha = 1;
}

function update() {
    if (isPaused) return;

    const head = {...snake[0]};

    
    if (powerUps.magnet) {
        const dx = food.x - head.x;
        const dy = food.y - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 200) {
            const angle = Math.atan2(dy, dx);
            head.x += Math.cos(angle) * 2;
            head.y += Math.sin(angle) * 2;
        }
    }

    switch(direction) {
        case 'up': head.y -= CELL_SIZE; break;
        case 'down': head.y += CELL_SIZE; break;
        case 'left': head.x -= CELL_SIZE; break;
        case 'right': head.x += CELL_SIZE; break;
    }

    
    if ((!powerUps.shield && !powerUps.ghost) && 
        (head.x < 0 || head.x >= canvas.width || 
         head.y < 0 || head.y >= canvas.height || 
         snake.some(seg => seg.x === head.x && seg.y === head.y))) {
        
        for (let i = 0; i < 50; i++) {
            createParticles(head.x + CELL_SIZE/2, head.y + CELL_SIZE/2, '#ff0055', 'sparkle');
        }
        gameOver();
        return;
    }

    snake.unshift(head);

    
    if (head.x === food.x && head.y === food.y) {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        const points = food.points * powerUps.multiplier * (powerUps.doublePoints ? 2 : 1);
        score += points;
        scoreElement.textContent = score > 0 ? score : 0;
        
        
        gameStats.totalFoodEaten++;
        if (food.type !== 'normal') {
            gameStats.specialFoodEaten++;
        }
        
        
        const particleCount = food.type === 'normal' ? 20 : 30;
        createParticles(food.x + CELL_SIZE/2, food.y + CELL_SIZE/2, food.color, 
            food.type === 'golden' ? 'star' : 'sparkle', particleCount);
        
        
        if (food.type !== 'normal') {
            ctx.fillStyle = food.color;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }
        
        
        if (food.effect) {
            activatePowerUp(food.effect);
        }
        
        
        if (food.type === 'poison') {
            snake.pop();
            snake.pop();
            combo = 0;
            createParticles(head.x + CELL_SIZE/2, head.y + CELL_SIZE/2, '#32CD32', 'sparkle', 40);
        }
        
        updateLevel();
        food = spawnFood();
        lastFoodTime = Date.now();
        
        
        checkAchievements();
    } else {
        snake.pop();
        if (Date.now() - lastFoodTime > 2000) {
            combo = 0;
        }
    }

    drawGame();
}

function drawGame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawFood();
    drawSnake();
    drawHUD();
    updateParticles();
}

function gameOver() {
    clearInterval(gameLoop);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    gameOverScreen.style.display = 'block';
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    finalComboElement.textContent = maxCombo;
    createParticles(canvas.width/2, canvas.height/2, '#ff0055', 100);
}

function togglePause() {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'block' : 'none';
}

function startGame() {
    snake = [{x: CELL_SIZE * 5, y: CELL_SIZE * 5}];
    direction = 'right';
    score = 0;
    combo = 0;
    currentLevel = 1;
    gameSpeed = 100;
    powerUps = { speedBoost: false, shield: false, multiplier: 1, ghost: false, magnet: false, rainbow: false, timeFreeze: false, doublePoints: false };
    scoreElement.textContent = '0';
    highScoreElement.textContent = highScore;
    food = spawnFood();
    gameOverScreen.style.display = 'none';
    pauseMenu.style.display = 'none';
    isPaused = false;
    
    
    Object.values(powerUpTimers).forEach(timer => clearTimeout(timer));
    powerUpTimers = {};
    
    
    document.querySelectorAll('.powerup-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.timer').textContent = '';
    });

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
}


canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
});

canvas.addEventListener('touchmove', (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== 'left') direction = 'right';
        else if (dx < 0 && direction !== 'right') direction = 'left';
    } else {
        if (dy > 0 && direction !== 'up') direction = 'down';
        else if (dy < 0 && direction !== 'down') direction = 'up';
    }

    touchStartX = touchEndX;
    touchStartY = touchEndY;
    e.preventDefault();
});


document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp': if(direction !== 'down') direction = 'up'; break;
        case 'ArrowDown': if(direction !== 'up') direction = 'down'; break;
        case 'ArrowLeft': if(direction !== 'right') direction = 'left'; break;
        case 'ArrowRight': if(direction !== 'left') direction = 'right'; break;
        case ' ': togglePause(); break;
    }
});

document.getElementById('upBtn').addEventListener('click', () => direction = 'up');
document.getElementById('downBtn').addEventListener('click', () => direction = 'down');
document.getElementById('leftBtn').addEventListener('click', () => direction = 'left');
document.getElementById('rightBtn').addEventListener('click', () => direction = 'right');
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('restartFromPauseBtn').addEventListener('click', startGame);
document.getElementById('shareBtn').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'Neon Snake Game',
            text: `I scored ${score} points in Neon Snake! Can you beat my score?`,
            url: window.location.href
        });
    } else {
        alert(`Share your score: ${score} points!`);
    }
});


function checkAchievements() {
    if (combo >= 10 && !achievements.comboMaster) {
        achievements.comboMaster = true;
        showAchievement('Combo Master!', 'Reached 10x combo!');
    }
    
    if (gameStats.specialFoodEaten >= 5 && !achievements.collector) {
        achievements.collector = true;
        showAchievement('Collector!', 'Collected 5 special food items!');
    }
    
    if (score >= 1000 && !achievements.speedRunner) {
        achievements.speedRunner = true;
        showAchievement('Speed Runner!', 'Reached 1000 points!');
    }
}

function showAchievement(title, description) {
    const achievement = document.createElement('div');
    achievement.className = 'achievement';
    achievement.innerHTML = `
        <div class="achievement-content">
            <i class="fas fa-trophy"></i>
            <div class="achievement-text">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        </div>
    `;
    document.body.appendChild(achievement);
    
    setTimeout(() => {
        achievement.classList.add('show');
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 500);
        }, 3000);
    }, 100);
}


resizeCanvas();
window.addEventListener('resize', resizeCanvas);
startGame();
