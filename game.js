'use strict'
const MINE = '💣'
const MARKED = '🚩'
const MANUAL = '🪏'

var gBoard
var gGame
var gTimeNow
var gTimerInterval
var gHints
var gSafeClickCount
var gManualMines
var gIsDarkMode = false
var gHistoryBoard
var gHistoryGame
var begginer = {
    bestScore: localStorage.getItem('begginer'),
    SIZE: 4,
    MINES: 2,

}
var interMediate = {
    SIZE: 8,
    MINES: 14,
    bestScore: localStorage.getItem('intermediate'),
}
var expert = {
    SIZE: 12,
    MINES: 32,
    bestScore: localStorage.getItem('expert'),
}
var gLevel = begginer


function onInit(level) {
    // localStorage.clear()
    stopTimer()
    gLevel = level
    gManualMines = level.MINES
    gGame = {
        isOn: false,
        reavealedCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        mines: gLevel.MINES,
        hintIsOn: false,
        isMegaHintOn: false,
        megaCells: [],
        isManualMode: false,
        extreminatorIsUsed: false,
        steps: 0,

    }
    gBoard = buildBoard()
    renderBoard()
    updateLivesCounter()
    hideElement('.modal-container')
    const elSmileyButton = document.querySelector('.smiley-button')
    elSmileyButton.innerText = '😃'
    const elBestScore = document.querySelector('.best-score span')
    elBestScore.innerText = gLevel.bestScore
    document.querySelector('.timer span').innerText = `${gGame.secsPassed} `
    gSafeClickCount = 3
    const elSafeClick = document.querySelector('.safe-click span')
    elSafeClick.innerText = gSafeClickCount
    gHints = createHints()
    renderHints()
    gHistoryBoard = []
    gHistoryGame = []

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

function renderBoard() {
    var strHTML = ''
    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += `<tr> `
        for (var j = 0; j < gLevel.SIZE; j++) {

            // const cell = (board[i][j].isMine) ? MINE : (board[i][j].minesAroundCount === 0) ? '' : board[i][j].minesAroundCount
            const className = (!gIsDarkMode) ? `cell hover-effect cell-${i}-${j} ` : `cell cell-dark-on hover-effect-dark cell-${i}-${j}`

            strHTML += `<td class="${className}"
                    onclick = "onCellClicked(this,${i},${j})"
                    oncontextmenu = "onCellRightClicked(this,event,${i},${j})"></td>`
        }
        strHTML += `</tr >`
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


    if (gGame.isManualMode && gManualMines > 0) {
        placeMine(currCell, elCell)
        return
    }

    prepareUndoFunc()

    if (!gGame.isOn) {
        createMines(gBoard, i, j)
        gGame.isOn = true
        startTimer()
    }


    if (gGame.hintIsOn) {
        revealNegs(i, j)
        return
    }

    if (gGame.isMegaHintOn) {
        clickToRevealMega({ i, j })
        return

    }

    currCell.isRevealed = true
    gGame.reavealedCount++

    if (!currCell.isMine && currCell.minesAroundCount === 0) expandReveal(gBoard, elCell, i, j)

    elCell.innerText = (currCell.isMine) ? MINE : (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount
    const className = (currCell.isMine) ? 'mine-clicked' : 'revealed'
    if (className === 'revealed') {
        if (!gIsDarkMode) elCell.classList.remove('hover-effect')
        else elCell.classList.remove('hover-effect-dark')
    }
    elCell.classList.add(className)

    if (currCell.isMine) {
        currCell.isRevealed = false
        gGame.reavealedCount--
        onMineClicked(elCell)
    }

    checkGameOver(currCell)
}

function prepareUndoFunc() {

    const lastBoard = copyMat(gBoard)
    const lastGGame = {
        reavealedCount: gGame.reavealedCount,
        markedCount: gGame.markedCount
    }

    gHistoryBoard.push(lastBoard)
    gHistoryGame.push(lastGGame)
    gGame.steps++

}

function onUndoClicked() {
    if (gGame.reavealedCount === 0) return
    if (gGame.steps === 1) {
        onInit(gLevel)
        return
    }
    gGame.steps--
    gBoard = gHistoryBoard.pop()
    const lastGGame = gHistoryGame.pop()
    gGame.reavealedCount = lastGGame.reavealedCount
    gGame.markedCount = lastGGame.markedCount

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            const prevCell = gBoard[i][j]
            const cellSelector = `.` + getClassName({ i, j })
            const elCell = document.querySelector(cellSelector)
            if (!prevCell.isRevealed && !prevCell.isMarked) {
                elCell.classList.remove('revealed')
                elCell.innerText = ''
            }
        }

    }

}

function onCellRightClicked(elCell, ev, i, j) {
    ev.preventDefault()

    if (!gGame.isOn && gGame.reavealedCount !== 0) return
    const currCell = gBoard[i][j]
    if (currCell.isRevealed && !currCell.isMine) return

    if (gGame.isOn) prepareUndoFunc()


    if (currCell.isRevealed && currCell.isMine) {
        onRightClickedMine(currCell, elCell)
    }

    if (currCell.isMarked) gGame.markedCount--
    else gGame.markedCount++

    currCell.isMarked = !currCell.isMarked

    elCell.innerText = (currCell.isMarked) ? MARKED : ''
    checkGameOver(currCell)
}

function createRandomMines(board, row, col) {
    for (var i = 0; i < gGame.mines; i++) {

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
            if (!gIsDarkMode) elNegCell.classList.remove('hover-effect')
            else elNegCell.classList.remove('hover-effect-dark')

            if (!currNeg.isMine && currNeg.minesAroundCount === 0) expandReveal(gBoard, elCell, i, j)

        }
    }
}

function checkGameOver(currCell) {


    if (currCell.isMine && gGame.lives === 0) {
        handleLose()
        return
    }
    if (gGame.reavealedCount === gLevel.SIZE ** 2 - gGame.mines
        && gGame.markedCount === gGame.mines) {
        handleWin()
        updateBestScore()

    }


}

function handleLose() {

    renderElement('.modal-container', 'GAME OVER')
    gGame.isOn = false
    revealAllMines(gBoard)
    const elSmileyButton = document.querySelector('.smiley-button')
    elSmileyButton.innerText = '🤯'
    stopTimer()


}

function handleWin() {

    renderElement('.modal-container', 'YOU WON!!!')
    const elSmileyButton = document.querySelector('.smiley-button')
    elSmileyButton.innerText = '😎'
    gGame.isOn = false
    stopTimer()

}

function updateBestScore() {


    var levelName = ''
    switch (gLevel.SIZE) {
        case 4: levelName = 'begginer'
            break
        case 6: levelName = 'intermediate'
            break
        case 12: levelName = 'expert'
            break
    }

    const score = gGame.secsPassed
    console.log('score', score)
    const bestScore = (localStorage.getItem(levelName)) ? localStorage.getItem(levelName) : Infinity
    if (score < bestScore) {
        localStorage.setItem(levelName, score)
        console.log(localStorage)
        gLevel.bestScore = score
    }
    const elBestScore = document.querySelector('.best-score span')
    elBestScore.innerText = gLevel.bestScore


}

function createMines(board, row, col) {

    if (!gGame.isManualMode) createRandomMines(board, row, col)

    // board[0][0].isMine = board[2][2].isMine = true //disable if random mines is on

    countNegsMines()


}
function countNegsMines() {


    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            gBoard[i][j].minesAroundCount = setMinesNegsCount(gBoard, i, j)
        }
    }
}

function revealAllMines(board) { //can be optimized
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const currCell = board[i][j]
            const currLocation = { i, j }
            if ((currCell.isMine) && !currCell.isMarked) {

                const cellSelector = `.` + getClassName(currLocation)
                const elCell = document.querySelector(cellSelector)
                elCell.innerText = MINE
                // elCell.classList.remove('mine-clicked')
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

function startTimer() {

    gTimeNow = Date.now()
    gTimerInterval = setInterval(TimerRunning, 1000)

}

function TimerRunning() {
    var timer = ((Date.now() - gTimeNow) / 1000).toFixed(0)
    document.querySelector('.timer span').innerText = timer
    gGame.secsPassed = timer



}

function stopTimer() {
    clearInterval(gTimerInterval)

}

function onRestartClicked() {
    stopTimer()
    onInit(gLevel)
}

function createHints() {
    const hints = []
    for (var i = 0; i < 3; i++) {
        hints.push({ element: '💡', isUsed: false })
    }
    return hints
}

function renderHints() {
    var strHTML = '<tr>'
    for (var i = 0; i < gHints.length; i++) {
        strHTML += `<td class="hint-off hint-hover-effect" onclick = "onHintClicked(this,${i})" > ${gHints[i].element}</td>`
    }
    strHTML += '</tr>'
    const elHints = document.querySelector('.hints')
    elHints.innerHTML = strHTML
}

function onHintClicked(elHint, i) {
    if (gGame.hintIsOn) return
    if (gHints[i].isUsed) return
    gHints[i].isUsed = true
    gGame.hintIsOn = true
    console.log(gHints)

    if (elHint.innerText) {
        elHint.classList.add('hint-on')
        elHint.classList.remove('hint-hover-effect')

    }

}

function onRightClickedMine(currCell, elCell) {
    currCell.isMarked = false
    currCell.isRevealed = false
    gGame.reavealedCount--
    elCell.classList.remove('revealed')

}

function onMineClicked(elCell) {

    elCell.classList.add('revealed')
    gGame.lives--
    updateLivesCounter()
    if (gGame.lives !== 0) {
        renderElement('.modal-container', 'be careful!')
        setTimeout(() => { hideElement('.modal-container') }, 2000)
        setTimeout(() => {
            {
                elCell.classList.remove('mine-clicked')
                if (gGame.isOn) {
                    elCell.classList.remove('revealed')
                    elCell.innerText = (elCell.innerText === MARKED) ? MARKED : ''
                }
            }
        }, 1500)

    }
}

function revealNegs(i, j) {

    const rowIdx = i
    const colIdx = j
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            // if (i === rowIdx && j === colIdx) continue
            const currNeg = gBoard[i][j]
            if (currNeg.isMarked) continue
            if (currNeg.isRevealed) continue
            const elNegCell = document.querySelector(`.cell-${i}-${j} `)
            elNegCell.innerText = (currNeg.isMine) ? MINE : (currNeg.minesAroundCount === 0) ? '' : currNeg.minesAroundCount
            elNegCell.classList.add('revealed-hint')
            const elHintOn = document.querySelector(`.hint-on`)
            setTimeout(() => {
                elNegCell.innerText = (elNegCell.innerText === MARKED) ? MARKED : ''
                elNegCell.classList.remove('revealed-hint')
                elHintOn.innerText = ''
                elHintOn.classList.remove('hint-on')
                gGame.hintIsOn = false
                // gHints.pop()
            }, 1500)

        }
    }
}

function onSafeClicked() {

    if (!gSafeClickCount) return

    const emptyLocation = findSafeLocation(gBoard)
    const rowIdx = emptyLocation.i
    const colIdx = emptyLocation.j
    const location = { i: rowIdx, j: colIdx }
    const currCell = gBoard[rowIdx][colIdx]

    const className = getClassName(location)
    const elHintedCell = document.querySelector(`.${className}`)
    elHintedCell.classList.add('revealed-hint')
    gSafeClickCount--
    const elSafeClick = document.querySelector('.safe-click span')
    elSafeClick.innerText = gSafeClickCount


    setTimeout(() => {
        elHintedCell.classList.remove('revealed-hint')
    }, 1500)


}

function findSafeLocation(board) {
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

function onManualyClicked() {
    if (gManualMines === 0) return
    if (gGame.steps > 0) return
    renderElement('.modal-container', `Place ${gManualMines} mines`)
    gGame.isManualMode = true

}

function placeMine(currCell, elCell) {

    gManualMines--

    renderElement('.modal-container', `Place ${gManualMines} mines`)
    currCell.isMine = true
    elCell.innerText = MANUAL
    setTimeout(() => { elCell.innerText = (elCell.innerText === MARKED) ? MARKED : '' }, 800)

    if (gManualMines === 0) {
        hideElement('.modal-container')
    }
}

function onDarkModeClicked(elBtn) {

    gIsDarkMode = !gIsDarkMode
    document.querySelector('body').classList.toggle('body-dark-on')
    document.querySelector('.modal-container').classList.toggle('modal-container-dark-on')
    // elBtn.classList.toggle('dark-mode-btn')
    elBtn.classList.toggle('dark-mode-btn-on')
    if (gIsDarkMode) elBtn.innerText = 'Undark Mode'
    else elBtn.innerText = 'Dark Mode'

    const elBoardCells = document.querySelectorAll('.cell')
    for (var i = 0; i < elBoardCells.length; i++) {
        elBoardCells[i].classList.toggle('cell-dark-on')
        elBoardCells[i].classList.toggle('hover-effect-dark')
        elBoardCells[i].classList.toggle('hover-effect')
    }

}

function copyMat(board) {

    var newMat = []
    for (var i = 0; i < board.length; i++) {
        newMat[i] = []
        for (var j = 0; j < board[0].length; j++) {

            const cellContent = {
                isRevealed: board[i][j].isRevealed,
                isMine: board[i][j].isMine,
                isMarked: board[i][j].isMarked,
                minesAroundCount: board[i][j].minesAroundCount
            }
            newMat[i][j] = cellContent

        }
    }

    return newMat

}

function onMegaHintClicked() {
    if (gGame.megaCells.length > 1) return
    gGame.isMegaHintOn = true
    renderElement('.modal-container', 'Click top-left area')

}

function clickToRevealMega(location) {
    const locations = gGame.megaCells
    locations.push(location)
    if (locations.length < 2) {
        renderElement('.modal-container', 'Click area right-left')
    }

    else {
        revealMegaHintCells(locations)
    }

}

function revealMegaHintCells(locations) {
    hideElement('.modal-container')
    console.log(locations[0])
    for (var i = locations[0].i; i <= locations[1].i; i++) {
        for (var j = locations[0].j; j <= locations[1].j; j++) {
            const currCell = gBoard[i][j]
            if (currCell.isMarked) continue
            if (currCell.isRevealed) continue
            const elCell = document.querySelector(`.cell-${i}-${j} `)
            elCell.innerText = (currCell.isMine) ? MINE : (currCell.minesAroundCount === 0) ? '' : currCell.minesAroundCount
            elCell.classList.add('revealed-hint')

            setTimeout(() => {
                elCell.innerText = (elCell.innerText === MARKED) ? MARKED : ''
                elCell.classList.remove('revealed-hint')
            }
                , 2000)
        }
    }
    gGame.isMegaHintOn = false
}

function onExtreminatorClicked() {
    if (!gGame.isOn) return
    if (gLevel === begginer) return
    if (gGame.extreminatorIsUsed) return
    const minesLocations = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine && !gBoard[i][j].isMarked) {
                const currLocation = { i, j }
                minesLocations.push(currLocation)
            }
        }
    }
    if (minesLocations.length < 3) return
    for (var i = 0; i < 3; i++) {
        const randIdx = getRandomInt(0, minesLocations.length)
        const randomMineLocation = minesLocations.splice([randIdx], 1)[0]
        const currMineCell = gBoard[randomMineLocation.i][randomMineLocation.j]
        currMineCell.isMine = false
    }

    gGame.mines = gGame.mines - 3
    countNegsMines()

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            const currCell = gBoard[i][j]
            if (currCell.isRevealed && currCell.minesAroundCount > 0) {
                const cellSelector = `.` + getClassName({ i, j })
                const elCell = document.querySelector(cellSelector)
                elCell.innerText = (`${currCell.minesAroundCount}`)
            }
        }
    }

    gGame.extreminatorIsUsed = true
    renderElement('.modal-container', '3 MINES ELIMINATED')
    setTimeout(() => { hideElement('.modal-container') }, 2000)
}