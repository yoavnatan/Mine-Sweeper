'use strict'


function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min  // The maximum is exclusive and the minimum is inclusive
}

function getRandomColor() {
    const letters = '0123456789ABCDEF'
    var color = '#'

    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

function createMat(ROWS, COLS) {
    const mat = []
    for (var i = 0; i < ROWS; i++) {
        const row = []
        for (var j = 0; j < COLS; j++) {
            row.push('')
        }
        mat.push(row)
    }
    return mat
}

function getClassName(location) { //returns cell-i-j
    const cellClass = `cell-${location.i}-${location.j}`
    console.log('CellClass', cellClass)
    return cellClass
}

function renderCell(location, value) { //{i,j}, value to render in the cell
    const cellSelector = `.` + getClassName(location)

    const elCell = document.querySelector(cellSelector)
    elCell.innerText = value

}