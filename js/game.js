'use strict'
const MINE = '💣'
const MARKED = '🚩'

var gBoard
var gGame
var gTimeNow
var gTimerInterval

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
        lives: 2,
    }
    gBoard = buildBoard()
    renderBoard(gBoard)
    updateLivesCounter()
    hideElement('.modal-container')
    const elSmileyButton = document.querySelector('.smiley-button')
    elSmileyButton.innerText = '😃'
    document.querySelector('.timer span').innerText = '0'

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

            strHTML += `<td class="${className}" 
            onclick="onCellClicked(this,${i},${j})" 
            oncontextmenu="onCellRightClicked(this,event,${i},${j})"></td>`
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
        createMines(gBoard, i, j)
        gGame.isOn = true
        startTimer()
    }


    currCell.isRevealed = true
    gGame.reavealedCount++


    if (!currCell.isMine && currCell.minesAroundCount === 0) expandReveal(gBoard, elCell, i, j)


    elCell.innerText = (currCell.isMine) ? MINE : (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount
    const className = (currCell.isMine) ? 'mine-clicked' : 'revealed'
    elCell.classList.add(className)

    if (currCell.isMine) {
        elCell.classList.add('revealed')
        console.log('isMine')
        gGame.lives--
        updateLivesCounter()
        if (gGame.lives !== 0) {
            renderElement('.modal-container', 'be careful!')
            setTimeout(() => { hideElement('.modal-container') }, 2000)
            setTimeout(() => { { elCell.classList.remove('mine-clicked') } }, 1500)
            // setTimeout(() => { { elCell.classList.remove('revealed') } }, 1500)
        }
    }


    checkGameOver(currCell)


}

function onCellRightClicked(elCell, ev, i, j) {
    ev.preventDefault()

    if (!gGame.isOn && gGame.reavealedCount !== 0) return
    const currCell = gBoard[i][j]
    if (currCell.isRevealed && !currCell.isMine) return
    if (currCell.isRevealed && currCell.isMine) {
        currCell.isMarked = false
        currCell.isRevealed = false
        elCell.classList.remove('revealed')
    }


    currCell.isMarked = !currCell.isMarked
    gGame.markedCound++
    elCell.innerText = (currCell.isMarked) ? MARKED : ''
}

function createRandomMines(board, row, col) {
    for (var i = gLevel.MINES; i < board.length; i++) {
        const emptylocation = findEmptyLocation(board, row, col)
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


    if (currCell.isMine && gGame.lives === 0) {
        console.log('lose')
        renderElement('.modal-container', 'Game-Over')
        gGame.isOn = false
        revealAllMines(gBoard)
        const elSmileyButton = document.querySelector('.smiley-button')
        elSmileyButton.innerText = '🤯'
        stopTimer()
        return
    }
    if (gGame.reavealedCount === gLevel.SIZE ** 2 - gLevel.MINES && gGame.markedCound === gLevel.MINES) {
        renderElement('.modal-container', 'YOU WON!!!')
        const elSmileyButton = document.querySelector('.smiley-button')
        elSmileyButton.innerText = '😎'
        console.log('win')
        gGame.isOn = false
        stopTimer()
    }


}

function createMines(board, row, col) {

    // board[0][0].isMine = board[2][2].isMine = true //disable if random mines is on
    createRandomMines(board, row, col)

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

function findEmptyLocation(board, row, col) {
    var emptyCells = []

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (i === row && j === col) continue
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

function updateLivesCounter() {

    const elLivesCounter = document.querySelector('.lives-counter span')
    elLivesCounter.innerText = gGame.lives

}

function onMineClicked(cell) { }

function startTimer() {

    gTimeNow = Date.now()
    gTimerInterval = setInterval(TimerRunning, 1000)

}

function TimerRunning() {
    var timer = ((Date.now() - gTimeNow) / 1000).toFixed(0)
    document.querySelector('.timer span').innerText = timer



}

function stopTimer() {

    clearInterval(gTimerInterval)
}

function onRestartClicked() {
    stopTimer()
    onInit()
}