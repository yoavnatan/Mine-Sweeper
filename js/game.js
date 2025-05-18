'use strict'
const MINE = '💣'
const MARKED = '🚩'

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


    return board
}


function renderBoard(board) {

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < board[0].length; j++) {

            // const cell = (board[i][j].isMine) ? MINE : (board[i][j].minesAroundCount === 0) ? '' : board[i][j].minesAroundCount
            const className = `cell cell-${i}-${j}`

            strHTML += `<td class="${className}" onclick="onCellClicked(this,${i},${j})" oncontextmenu="onCellRightClicked(this,event,${i},${j})"></td>`
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
    if (!gGame.isOn && gGame.reavealedCount !== 0) return
    const currCell = gBoard[i][j]
    if (currCell.isMarked) return
    if (currCell.isRevealed) return
    if (gGame.reavealedCount === 0) {
        createMines(gBoard)
        gGame.isOn = true
    }


    currCell.isRevealed = true
    gGame.reavealedCount++


    if (!currCell.isMine && currCell.minesAroundCount === 0) expandReveal(gBoard, elCell, i, j)


    elCell.innerText = (currCell.isMine) ? MINE : (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount
    const className = (currCell.isMine) ? 'mine-clicked' : 'revealed'
    elCell.classList.add(className)


    checkGameOver(currCell)


}

function onCellRightClicked(elCell, ev, i, j) {
    ev.preventDefault()
    if (!gGame.isOn && gGame.reavealedCount !== 0) return
    const currCell = gBoard[i][j]
    if (currCell.isRevealed) return
    currCell.isMarked = !currCell.isMarked
    gGame.markedCound++
    console.log('currCell.isMarked', currCell.isMarked)
    elCell.innerText = (currCell.isMarked) ? MARKED : ''
}

function createRandomMines(board) {
    for (var i = gLevel.MINES; i < board.length; i++) {
        const emptylocation = findEmptyLocation(board)
        const emptyCell = board[emptylocation.i][emptylocation.j]
        emptyCell.isMine = true
        // const i = getRandomInt(0, board.length)
        // const j = getRandomInt(0, board.length)
        // if (board[i][j].isMine) continue
        // board[i][j].isMine = true
    }
}

function expandReveal(board, elCell, i, j) {
    const rowIdx = i
    const colIdx = j
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            const currNeg = gBoard[i][j]
            if (currNeg.isMarked) continue
            if (currNeg.isRevealed) continue

            currNeg.isRevealed = true
            gGame.reavealedCount++

            const elNegCell = document.querySelector(`.cell-${i}-${j}`)
            elNegCell.innerText = (currNeg.minesAroundCount === 0) ? '' : currNeg.minesAroundCount
            elNegCell.classList.add('revealed')

        }
    }
}

function checkGameOver(currCell) {

    if (currCell.isMine) {
        console.log('lose')
        gGame.isOn = false
        revealAllMines(gBoard)
        return
    }
    if (gGame.reavealedCount === gLevel.SIZE ** 2 - gLevel.MINES && gGame.markedCound === gLevel.MINES) {
        console.log('win')
        gGame.isOn = false
    }


}

function createMines(board) {

    board[0][0].isMine = board[2][2].isMine = true //disable if random mines is on
    // createRandomMines(board)

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j].minesAroundCount = setMinesNegsCount(board, i, j)
        }
    }

}

function revealAllMines(board) { //can be optimized
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            const currLocation = { i, j }
            if ((currCell.isMine) && !currCell.isRevealed) {

                const cellSelector = `.` + getClassName(currLocation)
                const elCell = document.querySelector(cellSelector)
                elCell.innerText = MINE
                elCell.classList.add('revealed')
            }
        }
    }
}

function findEmptyLocation(board) {
    var emptyCells = []

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isRevealed && !board[i][j].isMarked && !board[i][j].isMine) {
                emptyCells.push({ i, j })
            }
        }
    }

    if (!emptyCells.length) return null
    const randIdx = getRandomInt(0, emptyCells.length)
    const emptyLocation = emptyCells[randIdx]
    return emptyLocation

}