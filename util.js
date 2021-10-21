function getMove(player, board) {

	let opponent;
	player === 1 ? opponent = 2 : opponent = 1 ;
	let opponentPositions = [];
	let allAdjacents = [];
	let openAdjacents = [];
	let possibleMoves = [];
	let mostCaptured = null;
	let bestMoves = [];
	let move = null;

	// find all opponent spaces
	for ( let row = 0; row < board.length; row++ ) {

		//skip rows that contain no opponent pieces
		if (!board[row].includes(opponent)) {
			continue;
		}

		//push coordinates of each opponent piece to opponentPositions
		for ( let i = 0 ; i < board[row].length; i++ ) {
			if (board[row][i] === opponent) {
				opponentPositions.push([row, i]);
			}
		}
		
	}
	
	// find all spaces adjacent to opponent that are unoccupied
	// for each opponent piece, find all eight possible flanks
	for ( let i = 0 ; i < opponentPositions.length ; i++ ) {
		const targetX = opponentPositions[i][0];
		const targetY = opponentPositions[i][1];
		allAdjacents.push(getAllAdjacentSpaces(targetX, targetY))
	}
	
	// filter all possible adjacents by those that are currently unoccupied
	// construct objects for each opponent space and their respective open adjacent spaces
	for ( let i = 0 ; i < allAdjacents.length ; i++ ) {
		
		for ( let j = 0; j < allAdjacents[i][1].length ; j++ ) {
			const targetX = allAdjacents[i][0][0];
			const targetY = allAdjacents[i][0][1];
			const adjX = allAdjacents[i][1][j][0];
			const adjY = allAdjacents[i][1][j][1];

			if ( adjX > 7 || adjX < 0 || adjY > 7 || adjY < 0 ) {
				continue;
			}

			if ( board[adjX][adjY] === 0 ) {
				const id = `${targetX}${targetY}`
				if (!openAdjacents.filter( obj => obj.id === `${targetX}${targetY}` ).length) {
					openAdjacents.push({
						id,
						target: [targetX, targetY],
						targetAdjs: [] 
					})
				}
				const currObj = openAdjacents.filter( obj => obj.id === id )[0]
				currObj.targetAdjs.push([adjX, adjY]);
			}
		}
	}

	// checks spaces along the vector of potentialMove -> opponentPiece for flanks and tracks how many pieces would be captured
	for ( let i = 0 ; i < openAdjacents.length ; i++ ) {
		for ( let j = 0 ; j < openAdjacents[i].targetAdjs.length ; j++ ) {
			const head = openAdjacents[i].target;
			const tail = openAdjacents[i].targetAdjs[j];
			const move = checkMove( head, tail, board, player, opponent );
			if (move.isMove) {
				possibleMoves.push( [move.move, move.captured] )
			}
		}
	}

	if ( possibleMoves.length === 0 ) {
		console.log('No more valid moves');
		return;
	}

	// find highest number of captured pieces of all possible moves
	for ( let i = 0 ; i < possibleMoves.length ; i++ ) {
		if ( !mostCaptured || possibleMoves[i][1] > mostCaptured ) {
			mostCaptured = possibleMoves[i][1];
		}
	}

	// refine list of possible moves to those that capture most pieces or secure an edge or corner
	for ( let i = 0 ; i < possibleMoves.length ; i++ ) {
		
		const id = possibleMoves[i][0].join('');

		if (isCorner(id)) {
			bestMoves.push(possibleMoves[i]);
			continue;
		}

		if (isEdge(id)) {
			bestMoves.push(possibleMoves[i]);
			continue;
		}

		if ( possibleMoves[i][1] === mostCaptured ) {
			bestMoves.push(possibleMoves[i]);
		}
	}

	if ( bestMoves.length === 1 ) {
		move = bestMoves[0][0];
		return move;

	} else {
		// strategy . . . ?

		// organize optimal moves into arrays by category: corners, traverses, edges
		const cornerMoves = [];
		const traverseMoves = [];
		const edgeMoves = [];

		for ( let i = 0 ; i < bestMoves.length ; i++ ) {
			const id = bestMoves[i][0].join('');

			if ( isCorner(id) ) {
				cornerMoves.push(bestMoves[i]);
			}

			if ( bestMoves[i][1] === 6 ) {
				traverseMoves.push(bestMoves[i]);
			}

			if ( isEdge(id) ) {
				const edgeCapture = bestMoves[i][1];
				if ( mostCaptured - edgeCapture < 4 ) {
					edgeMoves.push(bestMoves[i]);
				}
			}
		}

		// move hierarchy

		// sort corner moves array by how many opponent pieces are captured
		if (cornerMoves.length) {
			const descendingCorners = cornerMoves.sort((a,b) => {
				return b[1] - a[1];
			})
			move = descendingCorners[0][0];
			return move;
		}

		// if more than one traverse, select edge traverse if possible
		if (traverseMoves.length) {
			for ( let i = 0 ; i < traverseMoves.length; i++ ) {
				const traverseId = traverseMoves[i][0].join('')
				if ( isEdge(traverseId) ) {
					move = traverseMoves[i][0];
					return move;
				}
			}
			move = traverseMoves[0][0];
			return move;
		}

		// sort edge moves by how many pieces are captured
		if (edgeMoves.length) {
			const descendingEdges = edgeMoves.sort((a,b) => {
				return b[1] - a[1];
			})
			move = descendingEdges[0][0];
			return move;
		}

		// if no moves fall into optimal categories, sort moves by most opponent pieces captured
		// if more than one move captures the same number, return one at random
		const mostCapturedArr = bestMoves.filter( move => move[1] === mostCaptured);
		const randomIndex = Math.floor(Math.random() * mostCapturedArr.length);
		move = mostCapturedArr[randomIndex][0];
		return move;
	}
}

function getAllAdjacentSpaces(x, y) {
	return [
		[x, y],
		[
			[ x - 1 , y - 1 ],
			[ x - 1, y ],
			[ x - 1, y + 1 ],
			[ x, y - 1 ],
			[ x, y + 1 ],
			[ x + 1, y - 1 ],
			[ x + 1, y ],
			[ x + 1, y + 1 ]
		]
	]
}


//takes two sets of adjacent coordinates as arguments, returns the next space in the vector
function findNextSpaceInVector(head, tail) {
	const [headX, headY] = head;
	const [tailX, tailY] = tail;

	const xDelta = headX - tailX;
	const yDelta = headY - tailY;

	const newX = headX + xDelta;
	const newY = headY + yDelta;

	return [ [newX, newY] , head ];
}


function checkMove(head, tail, board, player, opponent) {
	let captured = 0;
	let [newHead, newTail] = findNextSpaceInVector(head, tail);

	while (true) {
		
		// get coordinates for next space and value
		let [x, y] = newHead;

		// return if next space is not on the board
		if ( x > 7 || x < 0 || y > 7 || y < 0 ) {
			return {
				isMove: false
			};
		}
		newHeadValue = board[x][y];
		

		// return false if no flank exists at next space or if next space is off the board
		if ( newHeadValue === 0 ) {
			return {
				isMove: false
			};
		}
		
		// if flank exists, increment captured pieces, return relevant values
		if ( newHeadValue === player) {
			captured += 1;
			return {
				isMove: true,
				move: tail,
				captured
			}
		}

		// if next space is opponent piece, increment captured pieces and iterate to next space in vector
		if ( newHeadValue === opponent ) {
			captured += 1;
			let [prevHead, prevTail] = [newHead, newTail]
			const nextSpace = findNextSpaceInVector( prevHead, prevTail );
			newHead = nextSpace[0];
			newTail = nextSpace[1];
		}
	}
}

function isCorner(id) {
	if ( id === '00' || id === '07' || id === '70' || id === '77' ) {
		return true;
	}
	return false;
}

function isEdge(id) {
	if ( id.includes('0') || id.includes('7') ) {
		return true;
	}
	return;
}

function prepareResponse(move) {
  const response = `${JSON.stringify(move)}\n`;
  console.log(`Sending response ${response}`);
  return response;
}

module.exports = {getMove, prepareResponse};
