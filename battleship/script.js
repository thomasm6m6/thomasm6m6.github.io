class Cell {
    // element
    // hasShip
    // hasShot
}

// TODO gray out area around a ship when it's sunk. Also, update `sunk` value.
// TODO display for number of ships left.

class Grid {
    constructor(size = 10) {
        this.size = size;
        this.cells = [];
    }
}

class Ship {
    constructor(name, size) {
        this.name = name;
        this.size = size;
        this.sunk = false;
    }
}

let grid = new Grid()

let ships = [
    new Ship("Carrier", 5),
    new Ship("Battleship", 4),
    new Ship("Cruiser", 3),
    new Ship("Submarine", 3),
    new Ship("Destroyer", 2)
]

let shotCells = [];

function doShot(event) {
    let element = event.currentTarget;
    console.log(element);
    let id = element.dataset.id;
    if (id === undefined) {
        alert("error")
    }

    console.log(shotCells);
    if (shotCells.includes(id)) {
        return;
    }

    var backgroundColor = '#2a2a2a';
    outer: for (let ship of ships) {
        for (let index of ship.indices) {
            if (index == id) {
                backgroundColor = '#ff0000';
                break outer;
            }
        }
    }
    element.style.backgroundColor = backgroundColor;

    let moveCounter = document.querySelector('#moveCounter');
    moveCounter.innerHTML = Number(moveCounter.innerHTML) + 1;

    shotCells.push(id);
}

function createGrid() {
    const gameBoard = document.getElementById('gameBoard');

    for (let i = 0; i < grid.size ** 2; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.id = i;
        cell.addEventListener("click", doShot);
        gameBoard.appendChild(cell);
        grid.cells.push(cell);
    }
}

function placeShips(grid, ships) {
    let allIndices = [];
    for (let ship of ships) {
        // What to do about the orientation of a given ship being predictable from the
        // sunk ships? Math.random < Math.random()? What does that even do?
        outer: while (true) {
            let isHorizontal = Math.random() < 0.5;
            let freeWidth = isHorizontal ? grid.size - ship.size : grid.size;
            let freeHeight = isHorizontal ? grid.size : grid.size - ship.size;
            let x = Math.floor(Math.random() * freeWidth);
            let y = Math.floor(Math.random() * freeHeight);
            let start = grid.size * y + x;
            let indices = [];
            for (i = 0; i < ship.size; i++) {
                let increment = isHorizontal ? i : i*grid.size;
                let index = start + increment;
                for (existingIndex of allIndices) {
                    console.log(existingIndex, index);
                    let xDiff = Math.abs(existingIndex%grid.size - index%grid.size);
                    let yDiff = Math.abs(Math.floor(existingIndex/grid.size) - Math.floor(index/grid.size));
                    if (xDiff < 2 && yDiff < 2) {
                        continue outer;
                    }
                }
                indices.push(index);
            }
            indices.forEach(i => allIndices.push(i));
            ship.indices = indices;
            break;
        }
    }
}

function startGame() {
    createGrid();
    placeShips(grid, ships);

    for (let ship of ships) {
        console.log(ship);
        for (let index of ship.indices) {
            grid.cells[index].innerHTML = ship.size;
            console.log(index);
        }
    }
}

document.addEventListener('DOMContentLoaded', startGame);