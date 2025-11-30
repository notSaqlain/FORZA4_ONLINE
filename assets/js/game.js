// FORZA4 Game Logic
const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER1 = 1;
const PLAYER2 = 2;

let board = [];
let currentPlayer = PLAYER1;
let gameOver = false;
let gameMode = 'pvp'; // 'pvp' or 'pvcpu'
let stats = {
    p1Wins: 0,
    p2Wins: 0
};

// Initialize the game
function initGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    currentPlayer = PLAYER1;
    gameOver = false;

    // Read mode from localStorage
    gameMode = localStorage.getItem('forza4_gameMode') || 'pvp';

    loadStats();
    createBoard();
    updateStatus();
    updateStatsUI();
}

// Load stats from localStorage
function loadStats() {
    const savedStats = localStorage.getItem('forza4_stats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('forza4_stats', JSON.stringify(stats));
}

// Update Stats UI
function updateStatsUI() {
    document.getElementById('p1-wins').textContent = stats.p1Wins;
    document.getElementById('p2-wins').textContent = stats.p2Wins;
}

// Create the game board UI
function createBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(col));
            boardElement.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(col) {
    if (gameOver) return;
    if (gameMode === 'pvcpu' && currentPlayer === PLAYER2) return; // Block input during AI turn

    if (makeMove(col)) {
        if (!gameOver && gameMode === 'pvcpu' && currentPlayer === PLAYER2) {
            setTimeout(makeAIMove, 500); // Small delay for AI
        }
    }
}

// Make a move
function makeMove(col) {
    const row = getLowestEmptyRow(col);
    if (row === -1) return false; // Column is full

    // Place the piece
    board[row][col] = currentPlayer;
    updateCell(row, col);

    // Check for win or draw
    if (checkWin(row, col)) {
        gameOver = true;
        highlightWinningCells();
        updateStatus(`Player ${currentPlayer} Wins!`, true);

        if (currentPlayer === PLAYER1) {
            stats.p1Wins++;
            syncStats(true); // Sync win for logged in user (assuming they are P1)
        } else {
            stats.p2Wins++;
            syncStats(false); // Sync loss
        }
        saveStats();
        updateStatsUI();

        return true;
    }

    if (checkDraw()) {
        gameOver = true;
        updateStatus("It's a Draw!", false, true);
        return true;
    }

    // Switch player
    currentPlayer = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
    updateStatus();
    return true;
}

// AI Logic
function makeAIMove() {
    if (gameOver) return;

    // 1. Check for winning move
    let col = findBestMove(PLAYER2);
    if (col === -1) {
        // 2. Check for blocking move
        col = findBestMove(PLAYER1);
    }
    if (col === -1) {
        // 3. Random valid move
        const validCols = [];
        for (let c = 0; c < COLS; c++) {
            if (board[0][c] === EMPTY) validCols.push(c);
        }
        if (validCols.length > 0) {
            col = validCols[Math.floor(Math.random() * validCols.length)];
        }
    }

    if (col !== -1) {
        makeMove(col);
    }
}

// Find a column that results in a win for the given player
function findBestMove(player) {
    for (let col = 0; col < COLS; col++) {
        const row = getLowestEmptyRow(col);
        if (row !== -1) {
            // Simulate move
            board[row][col] = player;
            if (checkWin(row, col)) {
                // Undo move
                board[row][col] = EMPTY;
                return col;
            }
            // Undo move
            board[row][col] = EMPTY;
        }
    }
    return -1;
}

// Get the lowest empty row in a column
function getLowestEmptyRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            return row;
        }
    }
    return -1;
}

// Update cell display
function updateCell(row, col) {
    const cells = document.querySelectorAll('.cell');
    const cellIndex = row * COLS + col;
    const cell = cells[cellIndex];

    if (board[row][col] === PLAYER1) {
        cell.classList.add('player1');
    } else if (board[row][col] === PLAYER2) {
        cell.classList.add('player2');
    }
}

// Check if current player has won
function checkWin(row, col) {
    return checkDirection(row, col, 0, 1) || // Horizontal
        checkDirection(row, col, 1, 0) || // Vertical
        checkDirection(row, col, 1, 1) || // Diagonal /
        checkDirection(row, col, 1, -1);  // Diagonal \
}

// Check a specific direction for four in a row
function checkDirection(row, col, deltaRow, deltaCol) {
    let count = 1;
    const player = board[row][col];

    // Check in positive direction
    let r = row + deltaRow;
    let c = col + deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += deltaRow;
        c += deltaCol;
    }

    // Check in negative direction
    r = row - deltaRow;
    c = col - deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r -= deltaRow;
        c -= deltaCol;
    }

    return count >= 4;
}

// Check if the board is full (draw)
function checkDraw() {
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === EMPTY) {
            return false;
        }
    }
    return true;
}

// Highlight winning cells
function highlightWinningCells() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === currentPlayer) {
                if (isPartOfWinningSequence(row, col)) {
                    const cells = document.querySelectorAll('.cell');
                    const cellIndex = row * COLS + col;
                    cells[cellIndex].classList.add('winning');
                }
            }
        }
    }
}

// Check if a cell is part of winning sequence
function isPartOfWinningSequence(row, col) {
    return isPartOfDirection(row, col, 0, 1) || // Horizontal
        isPartOfDirection(row, col, 1, 0) || // Vertical
        isPartOfDirection(row, col, 1, 1) || // Diagonal /
        isPartOfDirection(row, col, 1, -1);  // Diagonal \
}

// Check if cell is part of winning sequence in a direction
function isPartOfDirection(row, col, deltaRow, deltaCol) {
    const player = board[row][col];
    let count = 1;

    // Check positive direction
    let r = row + deltaRow;
    let c = col + deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r += deltaRow;
        c += deltaCol;
    }

    // Check negative direction
    r = row - deltaRow;
    c = col - deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        count++;
        r -= deltaRow;
        c -= deltaCol;
    }

    return count >= 4;
}

// Update status message
function updateStatus(message = null, isWinner = false, isDraw = false) {
    const statusElement = document.getElementById('status');

    if (message) {
        statusElement.textContent = message;
        if (isWinner) {
            statusElement.classList.add('winner');
            statusElement.classList.remove('draw');
        } else if (isDraw) {
            statusElement.classList.add('draw');
            statusElement.classList.remove('winner');
        }
    } else {
        if (gameMode === 'pvcpu' && currentPlayer === PLAYER2) {
            statusElement.textContent = `CPU is thinking...`;
        } else {
            statusElement.textContent = `Player ${currentPlayer}'s Turn`;
        }
        statusElement.classList.remove('winner', 'draw');
    }
}

// Mode Selection Handlers - Removed in favor of Dashboard
// document.getElementById('pvp-btn').addEventListener('click', ...);
// document.getElementById('pvcpu-btn').addEventListener('click', ...);

// Home button handler
document.getElementById('home-btn').addEventListener('click', () => {
    window.location.href = 'home.html';
});

// Reset button handler
document.getElementById('reset-btn').addEventListener('click', initGame);

// Initialize game on page load
initGame();

// Update Stats UI (and sync with backend)
function updateStatsUI() {
    document.getElementById('p1-wins').textContent = stats.p1Wins;
    document.getElementById('p2-wins').textContent = stats.p2Wins;
}

async function syncStats(isWin) {
    const user = JSON.parse(localStorage.getItem('forza4_user'));
    if (user) {
        const formData = new FormData();
        formData.append('action', 'update_stats');
        formData.append('username', user.username);
        formData.append('win', isWin);

        try {
            await fetch('api.php', { method: 'POST', body: formData });
        } catch (e) {
            console.error('Failed to sync stats', e);
        }
    }
}
