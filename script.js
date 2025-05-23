// Get references to DOM elements
const coinContainer = document.getElementById('coinContainer');
const movesCount = document.getElementById('movesCount');
const goalToggle = document.getElementById('goalToggle');

// Game state variables
let coins = [];         // Array holding the state ('heads' or 'tails') of each coin
let maxMoves = 0;       // Number of moves left
let draggedIndex = null; // For drag-and-drop functionality
let minMoves = 0;       // Minimum moves required to solve the puzzle


// Initialize the game state and UI
function initGame() {
    const n = 10;
    maxMoves = n;
    coins = [];

    // hide overlay and clear old data
    const overlay = document.getElementById("resultOverlay");
    if (overlay) {
        overlay.classList.add("hidden");
        overlay.style.display = "none";
        const oldBtn = overlay.querySelector("button");
        if (oldBtn) oldBtn.remove();
    }

    document.querySelectorAll('.confetti').forEach(c => c.remove());

    for (let i = 0; i < n; i++) {
        coins.push(Math.random() < 0.5 ? 'heads' : 'tails');
    }

    renderCoins();
    updateCoinsDisplay();
    movesCount.textContent = maxMoves;
    updateMinMovesDisplay(); // 👈 Add this

    minMoves = calculateMinMovesAlgo1();
    updateMinMovesDisplay();

}


// Render the coins as images and set up their event handlers
function renderCoins() {
    coinContainer.innerHTML = '';
    

    coins.forEach((side, i) => {
        const img = document.createElement('img');
        img.src = `assets/${side}.png`;
        img.classList.add('coin');
        img.setAttribute('draggable', true);
        img.dataset.index = i;

        // When a coin is clicked, flip a group starting from this index
        img.onclick = () => {
            if (maxMoves > 0) {
                flipGroup(i, 3); // flip 3 coins starting at i (if you want group flip)
                maxMoves--;
                minMoves--;
                movesCount.textContent = minMoves;
                movesCount.textContent = maxMoves;
            }
        };

        // Drag-and-drop handlers for rearranging coins
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

        // When a coin is clicked, flip all consecutive coins of the same side from this index
        img.onclick = () => {
            flipFromIndex(i);
        };

        coinContainer.appendChild(img);
    });
}

// Flip all consecutive coins of the same side starting from a given index
function flipFromIndex(index) {
    if (maxMoves <= 0) return;

    const targetSide = coins[index];
    let i = index;

    // Flip all consecutive coins with the same side
    while (i < coins.length && coins[i] === targetSide) {
        coins[i] = targetSide === 'heads' ? 'tails' : 'heads';
        i++;
    }

    maxMoves--;
    minMoves--;

    movesCount.textContent = maxMoves;
    updateMinMovesDisplay(); // ✅ Update display on every move

    updateCoinsDisplay(index, i - index);
    checkGameStatus();
}


// Check if the player has won or lost after a move
function checkGameStatus() {
    const goal = goalToggle.value;
    const allMatch = coins.every(c => c === goal);

    if (allMatch) {
        showEndMessage("🎉 Congratulations! You solved the puzzle!", true);
    } else if (maxMoves <= 0) {
        showEndMessage("💥 You lost! Try again.", false);
    }
}

// Show the endgame overlay with a message and confetti if won
function showEndMessage(message, celebrate) {
    const overlay = document.getElementById("resultOverlay");
    const msg = document.getElementById("resultMessage");

    msg.innerText = message;

    // Remove old "Play Again" button if present
    const oldBtn = overlay.querySelector("button");
    if (oldBtn) oldBtn.remove();

    // Add a new "Play Again" button
    const btn = document.createElement("button");
    btn.innerText = "Play Again";
    btn.onclick = initGame;
    overlay.appendChild(btn);

    overlay.classList.remove("hidden");
    overlay.style.display = "flex";

    // If celebrate is true, show confetti
    if (celebrate) {
        for (let i = 0; i < 100; i++) {
            createConfetti();
        }
    }
}

// Create a single confetti element and animate it
function createConfetti() {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3000);
}

// Animate coin flipping by updating their images
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

// Move a coin from one position to another (drag-and-drop)
function moveCoin(from, to) {
    if (from === to) return;
    const temp = coins[from];
    coins.splice(from, 1);
    coins.splice(to, 0, temp);
    renderCoins();
}

// Auto solve the puzzle using the selected algorithm
function autoSolve(algorithm) {
    if (algorithm === 1) {
        solveAlgo1(); // Let solveAlgo1 handle its own animations and status check
    } else {
        solveAlgo2(); // Already handles its own animation and status check
    }
}

function solveAlgo2() {
    const goal = goalToggle.value;
    let current = 0;
    
    // Phase 1: Separation - move non-goal coins to the end
    function separateCoins() {
        // Find next non-goal coin
        while (current < coins.length && coins[current] === goal) {
            current++;
        }
        
        // If we've reached the end or all remaining coins are non-goal, start flipping phase
        if (current >= coins.length) {
            startFlippingPhase();
            return;
        }
        
        // Check if all remaining coins are non-goal (already separated)
        let allRemainingAreNonGoal = true;
        for (let i = current; i < coins.length; i++) {
            if (coins[i] === goal) {
                allRemainingAreNonGoal = false;
                break;
            }
        }
        
        if (allRemainingAreNonGoal) {
            startFlippingPhase();
            return;
        }
        
        // Skip if already at end
        if (current === coins.length - 1) {
            current++;
            separateCoins();
            return;
        }
        
        // Animate moving this non-goal coin to the end
        const imgs = document.querySelectorAll('.coin');
        const coinNode = imgs[current];
        
        // Lift the coin up
        coinNode.classList.add('lift');
        
        setTimeout(() => {
            // After lift animation completes, REMOVE the class and use inline styles
            coinNode.classList.remove('lift');
            
            // Maintain the lifted position with inline styles
            coinNode.style.transition = 'none';
            coinNode.style.transform = 'translateY(-80px) scale(1.15)';
            coinNode.style.zIndex = '6';
            
            // Force reflow
            void coinNode.offsetWidth;
            
            // Slide other coins left
            for (let i = current + 1; i < imgs.length; i++) {
                imgs[i].style.transition = 'transform 0.5s ease';
                imgs[i].style.transform = `translateX(-${140 + 15}px)`;
            }
            
            // After other coins slide, move the lifted coin to the end
            setTimeout(() => {
                // Calculate distance to end
                const containerWidth = coinContainer.offsetWidth;
                const coinWidth = coinNode.offsetWidth;
                const gapWidth = 15;
                const moveDistance = containerWidth - (current * (coinWidth + gapWidth)) - coinWidth;
                
                // Move horizontally while staying lifted
                coinNode.style.transition = 'transform 0.8s ease';
                coinNode.style.transform = `translateY(-80px) translateX(${moveDistance}px) scale(1.15)`;
                
                // Drop the coin at the end
                setTimeout(() => {
                    coinNode.style.transition = 'transform 0.4s ease'; 
                    coinNode.style.transform = `translateX(${moveDistance}px)`;
                    coinNode.style.zIndex = '2';
                    
                    // Update array after all animations
                    setTimeout(() => {
                        const [moved] = coins.splice(current, 1);
                        coins.push(moved);
                        renderCoins();
                        
                        // Continue to next coin (don't increment current since array changed)
                        setTimeout(() => separateCoins(), 100);
                    }, 400);
                }, 800);
            }, 500);
        }, 350);
    }
    
    // Phase 2: Flipping - flip all non-goal coins at the end
    function startFlippingPhase() {
        let flipIndex = 0;
        
        function flipNextCoin() {
            // Find next non-goal coin
            while (flipIndex < coins.length && coins[flipIndex] === goal) {
                flipIndex++;
            }
            
            // If all coins are already goal, we're done
            if (flipIndex >= coins.length) {
                maxMoves = 0;
                movesCount.textContent = maxMoves;
                checkGameStatus();
                return;
            }
            
            // Flip this coin with animation
            const imgs = document.querySelectorAll('.coin');
            imgs[flipIndex].classList.add('flip');
            
            setTimeout(() => {
                coins[flipIndex] = goal;
                imgs[flipIndex].src = `assets/${goal}.png`;
                imgs[flipIndex].classList.remove('flip');
                
                flipIndex++;
                setTimeout(flipNextCoin, 300);
            }, 200);
        }
        
        // Start flipping coins
        flipNextCoin();
    }
    
    // Start with the separation phase
    separateCoins();
}



// Algorithm 1: Simply flip all non-goal coins to goal
function solveAlgo1() {
    const goal = goalToggle.value;
    let flipIndex = 0;
    
    function flipNextCoin() {
        // Find next non-goal coin
        while (flipIndex < coins.length && coins[flipIndex] === goal) {
            flipIndex++;
        }
        
        // If all coins are already goal, we're done
        if (flipIndex >= coins.length) {
            maxMoves = 0;
            movesCount.textContent = maxMoves;
            checkGameStatus();
            return;
        }
        
        // Flip this coin with animation
        const imgs = document.querySelectorAll('.coin');
        imgs[flipIndex].classList.add('flip');
        
        setTimeout(() => {
            coins[flipIndex] = goal;
            imgs[flipIndex].src = `assets/${goal}.png`;
            imgs[flipIndex].classList.remove('flip');
            
            flipIndex++;
            setTimeout(flipNextCoin, 300); // Continue to next coin
        }, 200);
    }
    
    // Start flipping coins
    flipNextCoin();
}

function calculateMinMovesAlgo1() {
    const goal = goalToggle.value;
    const tempCoins = [...coins];
    let moves = 0;
    let i = 0;
    while (i < tempCoins.length) {
        if (tempCoins[i] !== goal) {
            let j = i;
            while (j < tempCoins.length && tempCoins[j] !== goal) {
                tempCoins[j] = goal;
                j++;
            }
            moves++;
            i = j;
        } else {
            let j = i;
            while (j < tempCoins.length && tempCoins[j] === goal) j++;
            i = j;
        }
    }
    return moves;
}

function updateMinMovesDisplay() {
    document.getElementById('minMovesCount').textContent = minMoves;
}

goalToggle.addEventListener('change', () => {
    minMoves = calculateMinMovesAlgo1();
    updateMinMovesDisplay();
});


// Start the game when the script loads
initGame();
