'use strict'
const MINE = '💣'

var gBoard
var gGame

var gLevel = {
    SIZE: 4,
    MINES: 2,
}


function onInit() {
    gGame = {
        isOn: false,
        reavealedCount: 0,
        markedCound: 0,
        secsPassed: 0,
    }
    gBoard = buildBoard()
    console.table(gBoard)
    renderBoard(gBoard)

}

function buildBoard() {

    const board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            const cellContent = {
                isRevealed: false,
                isMine: false,
                isMarked: false,
            }
            board[i][j] = cellContent
        }
    }

    board[0][0].isMine = board[2][2].isMine = true
    // createRandomMines(board)
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j].minesAroundCount = setMinesNegsCount(board, i, j)
        }
    }
    return board
}


function renderBoard(board) {

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < board[0].length; j++) {

            // const cell = (board[i][j].isMine) ? MINE : (board[i][j].minesAroundCount === 0) ? '' : board[i][j].minesAroundCount
            const className = `cell cell-${i}-${j}`

            strHTML += `<td class="${className}" onclick="onCellClicked(this,${i},${j})"></td>`
        }
        strHTML += `</tr>`
    }

    const elContainer = document.querySelector('.board-container tbody')
    elContainer.innerHTML = strHTML

}

function setMinesNegsCount(board, rowIdx, colIdx) {


    var minesNegsCount = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            if (board[i][j].isMine) {
                minesNegsCount++
            }
        }
    }
    return minesNegsCount
}

function onCellClicked(elCell, i, j) {
    gBoard[i][j].isRevealed = true
    gGame.reavealedCount++
    elCell.innerText = (gBoard[i][j].isMine) ? MINE : (gBoard[i][j].minesAroundCount === 0) ? '' : gBoard[i][j].minesAroundCount
    const className = (gBoard[i][j].isMine) ? 'mine-clicked' : 'revealed'
    elCell.classList.add(className)
}

function createRandomMines(board) {
    for (var i = gLevel.MINES; i < board.length; i++) {
        const i = getRandomInt(0, board.length)
        const j = getRandomInt(0, board.length)
        if (board[i][j].isMine) continue
        board[i][j].isMine = true
    }
}