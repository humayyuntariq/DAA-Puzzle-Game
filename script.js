const coinContainer = document.getElementById('coinContainer');
const movesCount = document.getElementById('movesCount');
const goalToggle = document.getElementById('goalToggle');
let coins = [];
let maxMoves = 0;
let draggedIndex = null;

// Initialize the game
function initGame() {
    const n = 10;
    maxMoves = n;
    coins = [];

    const overlay = document.getElementById("resultOverlay");
    if (overlay) {
        overlay.classList.add("hidden");
        overlay.style.display = "none";

        // Optional: clean any dynamic buttons
        const oldBtn = overlay.querySelector("button");
        if (oldBtn) oldBtn.remove();
    }

    // Remove any leftover confetti
    document.querySelectorAll('.confetti').forEach(c => c.remove());

    // Generate new coin states
    for (let i = 0; i < n; i++) {
        coins.push(Math.random() < 0.5 ? 'heads' : 'tails');
    }

    renderCoins();
    movesCount.textContent = maxMoves;
}




function renderCoins() {
    coinContainer.innerHTML = '';

    coins.forEach((side, i) => {
        const img = document.createElement('img');
        img.src = `/${side}.png`;
        img.classList.add('coin');
        img.setAttribute('draggable', true);
        img.dataset.index = i;

        // Flip from this index to i + 2 (simulate flipping group of 3)
        img.onclick = () => {
            if (maxMoves > 0) {
                flipGroup(i, 3); // flip 3 coins starting at i
                maxMoves--;
                movesCount.textContent = maxMoves;
            }
        };

        // Drag events for rearranging
        img.ondragstart = (e) => {
            draggedIndex = i;
            e.target.classList.add('dragging');
        };
        img.ondragend = (e) => {
            e.target.classList.remove('dragging');
        };
        img.ondragover = (e) => e.preventDefault();
        img.ondrop = (e) => {
            e.preventDefault();
            const targetIndex = Number(e.target.dataset.index);
            moveCoin(draggedIndex, targetIndex);
        };

        img.onclick = () => {
         flipFromIndex(i);
        };

        coinContainer.appendChild(img);
    });
}

function flipFromIndex(index) {
    if (maxMoves <= 0) return;

    const targetSide = coins[index];
    let i = index;

    // Flip all consecutive coins starting from index that have the same side
    while (i < coins.length && coins[i] === targetSide) {
        coins[i] = targetSide === 'heads' ? 'tails' : 'heads';
        i++;
    }

    maxMoves--;
    movesCount.textContent = maxMoves;
    updateCoinsDisplay(index, i - index);

    checkGameStatus(); // 🔥 This is critical
}


function checkGameStatus() {
    const goal = goalToggle.value;
    const allMatch = coins.every(c => c === goal);

    if (allMatch) {
        showEndMessage("🎉 Congratulations! You solved the puzzle!", true);
    } else if (maxMoves <= 0) {
        showEndMessage("💥 You lost! Try again.", false);
    }
}


function showEndMessage(message, celebrate) {
    const overlay = document.getElementById("resultOverlay");
    const msg = document.getElementById("resultMessage");

    msg.innerText = message;

    // Remove old button if any
    const oldBtn = overlay.querySelector("button");
    if (oldBtn) oldBtn.remove();

    const btn = document.createElement("button");
    btn.innerText = "Play Again";
    btn.onclick = initGame;
    overlay.appendChild(btn);

    overlay.classList.remove("hidden");
    overlay.style.display = "flex";

    if (celebrate) {
        for (let i = 0; i < 100; i++) {
            createConfetti();
        }
    }
}



function createConfetti() {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
}


function updateCoinsDisplay(start = 0, count = coins.length) {
    const imgs = document.querySelectorAll('.coin');
    for (let i = start; i < Math.min(coins.length, start + count); i++) {
        imgs[i].classList.add('flip');
        setTimeout(() => {
            imgs[i].src = `assets/${coins[i]}.png`;
            imgs[i].classList.remove('flip');
        }, 200);
    }
}

// Drag-and-drop coin movement
function moveCoin(from, to) {
    if (from === to) return;
    const temp = coins[from];
    coins.splice(from, 1);
    coins.splice(to, 0, temp);
    renderCoins();
}

// Auto solve using the selected algorithm
function autoSolve(algorithm) {
    if (algorithm === 1) solveAlgo1();
    else solveAlgo2();

    updateCoinsDisplay(); // reflect final state
    maxMoves = 0; // force evaluation
    movesCount.textContent = maxMoves;

    checkGameStatus(); // 🔥 needed here
}


// Algorithm 1 (Flip segments to goal)
function solveAlgo1() {
    let i = 0;
    const goal = goalToggle.value;
    while (i < coins.length) {
        if (coins[i] !== goal) {
            let j = i;
            while (j < coins.length && coins[j] !== goal) {
                coins[j] = goal;
                j++;
            }
            i = j;
        } else {
            let j = i;
            while (j < coins.length && coins[j] === goal) j++;
            i = j;
        }
    }
}

// Algorithm 2 (Swap tails to the end then flip)
function solveAlgo2() {
    let i = 0, m = coins.length - 1;
    const goal = goalToggle.value;
    while (i <= m) {
        if (coins[i] === goal) {
            i++;
        } else {
            [coins[i], coins[m]] = [coins[m], coins[i]];
            m--;
        }
    }
    for (let j = m + 1; j < coins.length; j++) {
        coins[j] = goal;
    }
}

initGame();
