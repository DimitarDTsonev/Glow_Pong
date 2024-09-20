const boardWidth = 1600;
const boardHeight = 850;
const playerWidth = 10;
const playerHeight = 70;
const ballRadius = 7.5;

let player1Score = 0;
let player2Score = 0;

class GlowEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.maxRadius = 60;
        this.opacity = 1;
        this.expansionSpeed = 2;
        this.fadeSpeed = 0.05;
        this.color = color;
    }

    update() {
        if (this.radius < this.maxRadius) {
            this.radius += this.expansionSpeed;
        }

        if (this.opacity > 0) {
            this.opacity -= this.fadeSpeed;
        }
    }

    draw(context) {
        if (this.opacity <= 0) return;

        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
        context.fill();
        context.closePath();
    }

    isDone() {
        return this.opacity <= 0;
    }
}

class Ball {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = boardWidth / 2;
        this.y = boardHeight / 2;
        this.radius = ballRadius;
        this.velocityX = Math.random() < 0.5 ? 2 : -2;
        this.velocityY = 2;
    }

    move() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.y - this.radius <= 0 || this.y + this.radius >= boardHeight) {
            this.velocityY *= -1;
            this.createGlowEffect(this.x, this.y, { r: 173, g: 216, b: 230 });
        }
    }

    draw(context) {
        context.fillStyle = "white";
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
        context.closePath();
    }

    checkCollision(player) {
        if (this.x - this.radius < player.x + player.width && 
            this.x + this.radius > player.x &&
            this.y > player.y && 
            this.y < player.y + player.height) {
            this.velocityX *= -1.1;
            player.flash();

            if (player.color === "skyblue") {
                this.createGlowEffect(this.x, this.y, { r: 135, g: 206, b: 235 });
            } else if (player.color === "lightcoral") {
                this.createGlowEffect(this.x, this.y, { r: 240, g: 128, b: 128 });
            }
        }
    }

    checkOutOfBounds() {
        if (this.x - this.radius <= 0) {
            player2Score++;
            this.reset();
        } else if (this.x + this.radius >= boardWidth) {
            player1Score++;
            this.reset();
        }
    }

    createGlowEffect(x, y, color) {
        glowEffects.push(new GlowEffect(x, y, color));
    }
}

class Player {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = playerWidth;
        this.height = playerHeight;
        this.velocityY = 0;
        this.color = color;
        this.originalColor = color;
        this.flashColor = this.color;
        this.flashDuration = 100;
        this.flashTimeout = null;
    }

    move() {
        this.y += this.velocityY;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > boardHeight) this.y = boardHeight - this.height;
    }

    draw(context) {
        context.fillStyle = this.color;
        context.shadowColor = this.color;
        context.shadowBlur = 20;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.shadowBlur = 0;
    }

    flash() {
        this.color = this.flashColor;
        if (this.flashTimeout) clearTimeout(this.flashTimeout);
        this.flashTimeout = setTimeout(() => {
            this.color = this.originalColor;
        }, this.flashDuration);
    }
}

class PongGame {
    constructor() {
        this.board = document.getElementById("board");
        this.context = this.board.getContext("2d");

        this.board.width = boardWidth;
        this.board.height = boardHeight;

        this.ball = new Ball();
        this.player1 = new Player(10, boardHeight / 2 - playerHeight / 2, "skyblue");
        this.player2 = new Player(boardWidth - playerWidth - 10, boardHeight / 2 - playerHeight / 2, "lightcoral");

        this.paused = false;
        this.keyStates = {};
        this.showPlayIcon = false;
        this.playIconTimeout = null;
        this.bindKeyEvents();
        this.start();
    }

    bindKeyEvents() {
        document.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                this.paused = !this.paused;
                if (this.paused) {
                    this.showPlayIcon = false;
                } else {
                    this.showPlayIcon = true;
                    if (this.playIconTimeout) clearTimeout(this.playIconTimeout);
                    this.playIconTimeout = setTimeout(() => {
                        this.showPlayIcon = false;
                    }, 1000);
                }
            }
            this.keyStates[e.code] = true;
        });

        document.addEventListener("keyup", (e) => {
            this.keyStates[e.code] = false;
        });
    }

    handlePlayerInput() {
        const maxSpeed = 6;
        const acceleration = 0.2;

        if (this.keyStates["KeyW"]) {
            this.player1.velocityY -= acceleration;
            if (this.player1.velocityY < -maxSpeed) this.player1.velocityY = -maxSpeed;
        } else if (this.keyStates["KeyS"]) {
            this.player1.velocityY += acceleration;
            if (this.player1.velocityY > maxSpeed) this.player1.velocityY = maxSpeed;
        } else {
            this.player1.velocityY *= 0.9;
        }

        if (this.keyStates["ArrowUp"]) {
            this.player2.velocityY -= acceleration;
            if (this.player2.velocityY < -maxSpeed) this.player2.velocityY = -maxSpeed;
        } else if (this.keyStates["ArrowDown"]) {
            this.player2.velocityY += acceleration;
            if (this.player2.velocityY > maxSpeed) this.player2.velocityY = maxSpeed;
        } else {
            this.player2.velocityY *= 0.9;
        }
    }

    drawBorders() {
        this.context.fillStyle = "lightblue";
        this.context.shadowColor = "lightblue";
        this.context.shadowBlur = 20;
        this.context.fillRect(0, 0, boardWidth, 10);
        this.context.fillRect(0, boardHeight - 10, boardWidth, 10);
        this.context.shadowBlur = 0;
    }

    drawMidLine() {
        for (let i = 10; i < boardHeight; i += 25) {
            this.context.fillStyle = "white";
            this.context.fillRect(boardWidth / 2 - 2, i, 5, 5);
        }
    }

    drawScore() {
        this.context.font = "45px sans-serif";
        this.context.fillText(player1Score, boardWidth / 5, 45);
        this.context.fillText(player2Score, boardWidth * 4 / 5 - 45, 45);
    }

    drawPauseIcon() {
        this.context.fillStyle = "rgba(0, 0, 0, 0)";
        this.context.fillRect(boardWidth / 2 - 50, boardHeight / 2 - 50, 100, 100);

        this.context.fillStyle = "white";
        this.context.font = "bold 50px Arial";

        if (this.paused) {
            this.context.fillRect(boardWidth / 2 - 15, boardHeight / 2 - 25, 10, 50);
            this.context.fillRect(boardWidth / 2 + 5, boardHeight / 2 - 25, 10, 50);
        } else if (this.showPlayIcon) {
            this.context.beginPath();
            this.context.moveTo(boardWidth / 2 - 15, boardHeight / 2 - 25);
            this.context.lineTo(boardWidth / 2 + 25, boardHeight / 2);
            this.context.lineTo(boardWidth / 2 - 15, boardHeight / 2 + 25);
            this.context.fill();
        }
    }

    update() {
        this.context.clearRect(0, 0, boardWidth, boardHeight);

        if (!this.paused) {
            this.handlePlayerInput();

            this.player1.move();
            this.player2.move();
            this.ball.move();

            this.ball.checkCollision(this.player1);
            this.ball.checkCollision(this.player2);

            this.ball.checkOutOfBounds();
        }

        this.player1.draw(this.context);
        this.player2.draw(this.context);
        this.ball.draw(this.context);
        this.drawBorders();
        this.drawMidLine();
        this.drawScore();

        for (let i = glowEffects.length - 1; i >= 0; i--) {
            glowEffects[i].update();
            glowEffects[i].draw(this.context);

            if (glowEffects[i].isDone()) {
                glowEffects.splice(i, 1);
            }
        }

        this.drawPauseIcon();

        requestAnimationFrame(() => this.update());
    }

    start() {
        requestAnimationFrame(() => this.update());
    }
}

const glowEffects = [];

window.onload = function () {
    new PongGame();
};