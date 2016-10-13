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

// function rollForFirstTurn() {
// 	rollDie(0);
// 	rollDie(1);
// } TODO: Implement to correctly pick first player to move

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
	var validBarMoves = getValidBarMoves();
	if (validBarMoves.length != 0) {
		if (startTriangle != -1) {
			return false;
		}
		return isValidBarMove(endTriangle);
	}
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
 * Returns an array of valid moves for the current player that involves
 * taking pieces off of the bar.
 */
function getValidBarMoves() {
	var moves = [];
	for (var endTriangle = 0; endTriangle < 24; endTriangle++) {
		if (isValidBarMove(endTriangle)) {
			moves.push([-1, endTriangle]);
		}
	}
	return moves;
}

/**
 * Returns 0 (false) if not a valid bar move.
 * Returns 1 if is a valid bar move using die #1.
 * Returns 2 if is a valid bar move using die #2.
 * Returns 3 if is a valid bar move using both dice.
 */
function isValidBarMove(endTriangle) {
	if (GameState.board.bar.indexOf(GameState.turn) == -1) {
		return false;
	}
	var die1 = GameState.dice[1][0];
	var die2 = GameState.dice[2][0];
	var triangle1;
	var triangle2;
	var triangle3;
	if (GameState.turn) {
		triangle1 = 24 - die1;
		triangle2 = 24 - die2;
		triangle3 = 24 - die1 - die2;
	} else {
		triangle1 = die1 - 1;
		triangle2 = die2 - 1;
		triangle3 = die1 + die2 - 1;
	}
	if (endTriangle == triangle1 && GameState.board.triangles[triangle1].indexOf(GameState.turn) != -1) {
		return 1;
	} else if (endTriangle == triangle2 && GameState.board.triangles[triangle2].indexOf(GameState.turn) != -1) {
		return 2;
	} else if (endTriangle == triangle3 && GameState.board.triangles[triangle3].indexOf(GameState.turn) != -1) {
		return 3;
	}
	return false;
}

/**
 * Returns the index i for which listy[i] == element.
 * If element is not in listy, returns -1;
 */
function contains(listy, element) {
	for (var i = 0; i < listy.length; i++) {
		if (listy[i] == element) {
			return i;
		}
	}
	return -1;
}

/**
 * Move one piece from startTriangle to the endTriangle. Moves the
 * current player's piece only, and will not make an invalid move.
 * TODO: add accounting for doubles being 'doubled'
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
	var moves = getValidMoves();
	if (moves.length != 0) {
		throw {
			message: "Turn is not finished.",
			validMoves: moves
		};
	}
	if (!checkWin()) {
		rollDie(0);
		rollDie(1);
		GameState.turn = !GameState.turn;
		spinboard();
	}
}

/**
 * Check for win conditions.
 */
function checkWin() {
}