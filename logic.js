// GameState variable to be watched by the UI
var GameState = {
	turn: 0,
	bearing: 0,
	dice: {
		1: [-1, 0],
		2: [-1, 0]
	},
	board: {
		triangles: [],
		bar: []
	},
	winner: undefined
}

// from the perspective of player 0
var pieceMappy = {
	23: [0, 0],
	12: [0, 0, 0, 0, 0],
	7:  [0, 0, 0],
	5:  [0, 0, 0, 0, 0],

	0:  [1, 1],
	11: [1, 1, 1, 1, 1],
	16: [1, 1, 1],
	18: [1, 1, 1, 1, 1]
}

// initialize GameState.board
for (var i = 0; i < 24; i++) {
	if (pieceMappy[i]) {
		GameState.board.triangles[i] = pieceMappy[i];
	} else {
		GameState.board.triangles[i] = [];
	}
}

/**
 * Roll the die at the given diePosition and set its 'used' value to false.
 */
function rollDie(diePosition) {
	GameState.dice[diePosition][0] = Math.floor(Math.random()*6) + 1;
	GameState.dice[diePosition][1] = 0;
}

/**
 * Return all valid moves for the current GameState.
 */
function getValidMoves() {
	var player = GameState.turn;
	var moves = [];
	for (var startTriangle = 0; startTriangle < 24; startTriangle++) {
		for (var endTriangle = startTriangle; endTriangle < 24; endTriangle++) {
			if (isValidMove(startTriangle, endTriangle)) {
				moves.push([startTriangle, endTriangle]);
			}
		}
	}
	return moves;
}

/**
 * Returns 0 (false) if not a valid move.
 * Returns 1 if is a valid move using die #1.
 * Returns 2 if is a valid move using die #2.
 * Returns 3 if is a valid move using both dice.
 */
function isValidMove(startTriangle, endTriangle) {
	var player = GameState.turn;
	if (GameState.board.triangles[startTriangle].length >= 1 &&
		GameState.board.triangles[startTriangle].indexOf(player) != -1 &&
		GameState.board.triangles[endTriangle].length <= 4 &&
		GameState.board.triangles[endTriangle].indexOf(!player) == -1) {
		if (endTriangle - startTriangle == GameState.dice[1][0] &&
			!GameState.dice[1][1]) {
			return 1;
		}
		if (endTriangle - startTriangle == GameState.dice[2][0] &&
			!GameState.dice[2][1]) {
			return 2;
		} 
		if (endTriangle - startTriangle == GameState.dice[1][0] + 
			GameState.dice[2][0] && !GameState.dice[1][1] &&
			!GameState.dice[2][1]) {
			return 3;
		}
	}
	return false;
}

/**
 * Move one piece from startTriangle to the endTriangle. Moves the 
 * current player's piece only, and will not make an invalid move.
 */
function makeMove(startTriangle, endTriangle) {
	var die = isValidMove(startTriangle, endTriangle);
	if (!die) {
		throw 'Invalid move';
	}
	GameState.board.triangles[endTriangle].push(
		GameState.board.triangles[startTriangle].pop());
	if (die == 3) {
		GameState.dice[1][1] = 1;
		GameState.dice[2][1] = 1;
	} else {
		GameState.dice[die][1] = 1;
	}
}

/**
 * Switch to the other player's turn. 
 * TODO: don't switch turns if a player can't legally end turn in the rules
 */
function endTurn() {
	if (!checkWin()) {
		rollDie(0);
		rollDie(1);
		GameState.turn = !GameState.turn;
	}
}

/**
 * Check for win conditions.
 */
function checkWin() {
}