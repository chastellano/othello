function getMove(player, board) {

	let opponent;
	player === 1 ? opponent = 2 : opponent = 1 ;
	let opponentPositions = [];
	let allAdjacents = [];
	let openAdjacents = [];
	// let secondaryAdjacents = [];
	// let opponentAdjacents = [];
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
		const [ targetX, targetY ] = opponentPositions[i];
		// const targetX = opponentPositions[i][0];
		// const targetY = opponentPositions[i][1];
		allAdjacents.push(getAllAdjacentSpaces(targetX, targetY))
	}
	
	// filter all possible adjacents by those that are currently unoccupied
	// construct objects for each opponent space and their respective open adjacent spaces
	function filterAdjacentSpaces( adjacentArr, filter, filteredArr ) {
		for ( let i = 0 ; i < adjacentArr.length ; i++ ) {
		
			for ( let j = 0; j < adjacentArr[i][1].length ; j++ ) {
				const [targetX, targetY] = adjacentArr[i][0];
				const [adjX, adjY] = adjacentArr[i][1][j];
	
				if ( adjX > 7 || adjX < 0 || adjY > 7 || adjY < 0 ) {
					continue;
				}
	
				// if space value matches filter value push space value into target adjacents array of corresponding object
				if ( board[adjX][adjY] === filter ) {
					const id = `${targetX}${targetY}`
					if (!filteredArr.filter( obj => obj.id === `${targetX}${targetY}` ).length) {
						filteredArr.push({
							id,
							target: [targetX, targetY],
							targetAdjs: []
						})
					}
					const currObj = filteredArr.filter( obj => obj.id === id )[0]
					currObj.targetAdjs.push([adjX, adjY]);
				}
			}
		}
	}

	filterAdjacentSpaces( allAdjacents, 0, openAdjacents );

	// checks spaces along the vector of ( potentialMove -> opponentPiece ) for flanks and tracks how many pieces would be captured
	for ( let i = 0 ; i < openAdjacents.length ; i++ ) {
		for ( let j = 0 ; j < openAdjacents[i].targetAdjs.length ; j++ ) {
			const head = openAdjacents[i].target;
			const tail = openAdjacents[i].targetAdjs[j];
			const move = checkMove( head, tail, board, player, opponent );
			
			// if it is not a valid move, continue to next iteration
			if (!move.isMove) {
				continue;
			}

			//find all adjacent opponents to move, pass exception for original opponent target so it is not counted twice
			let opponentAdjacents = []
			const [ targetX, targetY ] = move.move;
			const secondaryAdjacents = [getAllAdjacentSpaces(targetX, targetY, head)];
			filterAdjacentSpaces( secondaryAdjacents, opponent, opponentAdjacents )

			// if there is at least one additional opponent adjacent to the current move, find all potential captured pieces from other vectors
			if ( opponentAdjacents.length ) {
				// let secondaryCaptured = 0
				for ( let i = 0 ; i < opponentAdjacents.length ; i++ ) {
					for ( let j = 0 ; j < opponentAdjacents[i].targetAdjs.length ; j++ ) {
						const secondaryHead = opponentAdjacents[i].targetAdjs[j];
						const secondaryTail = opponentAdjacents[i].target;
						const secondaryMove = checkMove( secondaryHead, secondaryTail, board, player, opponent );
						if (secondaryMove.isMove) {
							move.captured.push(secondaryMove.captured[0])
						}
					}
				}
				// move.captured += secondaryCaptured;
			}

			let alreadyExists = false;
			for ( let i = 0 ; i < possibleMoves.length ; i++ ) {
				if ( possibleMoves[i][0].join('') === move.move.join('') ) {
					alreadyExists = true;
				}
			}

			if (!alreadyExists) {
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
		const totalCaptured = reduceCaptured(possibleMoves[i][1])
		if ( !mostCaptured || totalCaptured > mostCaptured ) {
			mostCaptured = totalCaptured;
		}
	}

	// refine list of possible moves to those that capture most pieces or secure an edge or corner
	const reducedPossibleMoves = possibleMoves.map( move => [ move[0], reduceCaptured(move[1]) ] )
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

		if ( reducedPossibleMoves[i][1] === mostCaptured ) {
			bestMoves.push(possibleMoves[i]);
		}
	}

	if ( bestMoves.length === 1 ) {
		const totalCaptured = reduceCaptured(bestMoves[0][1]);
		move = bestMoves[0][0];
		return move;

	} else {
		// strategy . . . ?
		// organize optimal moves into arrays by category: corners, traverses, edges

		const cornerMoves = [];
		const traverseMoves = [];
		const edgeMoves = [];
		const reducedBestMoves = bestMoves.map( move => [ move[0], reduceCaptured(move[1]) ] )

		for ( let i = 0 ; i < bestMoves.length ; i++ ) {
			const id = bestMoves[i][0].join('');

			if ( isCorner(id) ) {
				cornerMoves.push(bestMoves[i]);
			}

			if ( bestMoves[i][1].includes(6) ) {
				traverseMoves.push(bestMoves[i]);
			}

			if ( isEdge(id) ) {
				const edgeCapture = reducedBestMoves[i][1];
				if ( mostCaptured - edgeCapture < 4 ) {
					edgeMoves.push(bestMoves[i]);
				}
			}
		}

		// move hierarchy
		// reduce captured arrays in cornerMoves and sort by most pieces captured
		if (cornerMoves.length) {
			const reducedCorners = cornerMoves.map( move => [ move[0], reduceCaptured(move[1]) ] )
			const descendingCorners = reducedCorners.sort((a,b) => {
				return b[1] - a[1];
			})
			move = descendingCorners[0][0];
			return move;
		}

		// if more than one traverse, select edge traverse if possible, otherwise select traverse that captures most pieces
		if (traverseMoves.length) {
			const reducedTraverses = traverseMoves.map( move => [ move[0], reduceCaptured(move[1]) ] )
			const descendingTraverses = reducedTraverses.sort((a,b) => {
				return b[1] - a[1];
			})

			for ( let i = 0 ; i < descendingTraverses.length; i++ ) {
				const traverseId = descendingTraverses[i][0].join('')
				if ( isEdge(traverseId) ) {
					move = descendingTraverses[i][0];
					return move;
				}
			}

			move = descendingTraverses[0][0];
			return move;
		}

		// sort edge moves by how many pieces are captured
		if (edgeMoves.length) {
			const reducedEdges = edgeMoves.map( move => [ move[0], reduceCaptured(move[1]) ] )
			const descendingEdges = reducedEdges.sort((a,b) => {
				return b[1] - a[1];
			})
			move = descendingEdges[0][0];
			return move;
		}

		// if no moves fall into optimal categories, sort moves by most opponent pieces captured
		// if more than one move captures the same number, return one at random
		const mostCapturedArr = reducedBestMoves.filter( move => move[1] === mostCaptured);
		const randomIndex = Math.floor(Math.random() * mostCapturedArr.length);
		move = mostCapturedArr[randomIndex][0];
		return move;
	}
}

// returns all eight adjacent spaces for a given (x,y) coordinate
// an except value will skip a specific index
function getAllAdjacentSpaces(x, y, except = null) {

	let adjacents =  [
			[ x - 1 , y - 1 ],
			[ x - 1, y ],
			[ x - 1, y + 1 ],
			[ x, y - 1 ],
			[ x, y + 1 ],
			[ x + 1, y - 1 ],
			[ x + 1, y ],
			[ x + 1, y + 1 ]
	]
	
	if ( except ) {
		const exceptId = except.join('');
		const adjacentsWithException = adjacents.filter( space => space.join('') !== exceptId )
		return [ [x,y], adjacentsWithException ]
	}

	return [ [x,y] , adjacents ]
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


// traverses the board along the vector (tail > head)
// if a flank is found, it returns an object with the number of pieces captured
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
		

		// return false if no flank exists at next space
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
				captured: [captured]
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

const reduceCaptured = arr => arr.reduce( (acc, curr) => parseInt(acc) + parseInt(curr), 0 );

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