// 'use strict' ?
// TODO disable hover effect at end of game. might remove hover effect entirely, or at least make it *much* more subtle.

class Cell {
    constructor(element) {
        this.element = element;
        this.hasShip = false;
        this.hasShot = false;
    }
}

let gameOver = false;

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
        this.cells = [];
        this.indices = [];
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

// TODO put in top right corner, fade/slideout animation on timeout
// Persist for maybe 3 seconds
function message(string) {
    alert(string);
}

function doShot(event) {
    if (gameOver) return;

    let element = event.currentTarget;
    let id = element.dataset.id;
    if (id === undefined) {
        alert("error")
    }

    if (grid.cells[id].hasShot) {
        return;
    }

    let didHit = false;
    let theShip
    for (let ship of ships) {
        if (ship.cells[id] !== undefined) {
            didHit = true;
            ship.cells[id].hasShot = true;
            theShip = ship;
            break;
        }
    }

    if (didHit) {
        let sunk = true;
        for (let cell of theShip.cells) {
            if (cell === undefined) {
                continue;
            }

            if (!cell.hasShot) {
                sunk = false;
                break;
            }
        }
        if (sunk) {
            theShip.sunk = true;
            let allSunk = true;
            for (const ship of ships) {
                if (!ship.sunk) {
                    allSunk = false;
                    break;
                }
            }
            if (allSunk) {
                message("You win!")
                gameOver = true;
                let replayButton = document.querySelector('#replayButton');
                for (let cell of grid.cells) {
                    cell.element.tabIndex = -1;
                    // cell.style.pointerEvents = 'none';
                }
                replayButton.style.display = 'unset';
                return;
            }
            message(`Sunk the ${theShip.name}!`);
            let sorted = theShip.indices.sort((a, b) => a - b);
            let first = sorted[0], last = sorted[sorted.length-1];

            if (theShip.isHorizontal) {
                for (let i = first - grid.size - 1; i < last - grid.size + 2; i++) {
                    if (i >= 0 && i < 100) {
                        grid.cells[i].element.classList.add('miss');
                    }
                }
                for (let i = first + grid.size - 1; i < last + grid.size + 2; i++) {
                    if (i >= 0 && i < 100) {
                        grid.cells[i].element.classList.add('miss');
                    }
                }
                if (first - 1 >= 0) grid.cells[first-1].element.classList.add('miss');
                if (last + 1 < 100) grid.cells[last+1].element.classList.add('miss');
            } else {
                for (const index of sorted) {
                    let indexBefore = index - 1;
                    let indexAfter = index + 1;
                    if (indexBefore >= 0 && indexBefore % grid.size != 9) {
                        grid.cells[indexBefore].element.classList.add('miss');
                    }
                    if (indexAfter < 100 && indexAfter % grid.size != 0) {
                        grid.cells[indexAfter].element.classList.add('miss');
                    }
                }

                let indexFirst = first - grid.size;
                if (indexFirst >= 0) {
                    grid.cells[indexFirst].element.classList.add('miss');
                }
                if (indexFirst - 1 >= 0 && (indexFirst - 1) % grid.size != 9) {
                    grid.cells[indexFirst - 1].element.classList.add('miss');
                }
                if (indexFirst + 1 >= 0 && (indexFirst + 1) % grid.size != 0) {
                    grid.cells[indexFirst + 1].element.classList.add('miss');
                }

                let indexLast = last + grid.size;
                if (indexLast >= 0) {
                    grid.cells[indexLast].element.classList.add('miss');
                }
                if (indexLast - 1 && (indexLast - 1) % grid.size != 9) {
                    grid.cells[indexLast - 1].element.classList.add('miss');
                }
                if (indexLast + 1 && (indexLast + 1) && grid.size != 0) {
                    grid.cells[indexLast + 1].element.classList.add('miss');
                }
            }
        }

        element.classList.add('hit');
        let hitCounter = document.querySelector('#hitCounter');
        hitCounter.innerHTML = Number(hitCounter.innerHTML) + 1;
    } else {
        element.classList.add('miss');
        let missCounter = document.querySelector('#missCounter');
        missCounter.innerHTML = Number(missCounter.innerHTML) + 1;
    }

    grid.cells[id].hasShot = true;
}

function createGrid() {
    const gameBoard = document.getElementById('gameBoard');

    for (let i = 0; i < grid.size ** 2; i++) {
        const element = document.createElement('div');
        element.className = 'cell';
        element.dataset.id = i;
        element.addEventListener("click", doShot);
        gameBoard.appendChild(element);
        const cell = new Cell(element);
        grid.cells.push(cell);
    }
}

function placeShips(grid, ships) {
    let allIndices = [];
    for (let ship of ships) {
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
                ship.isHorizontal = isHorizontal;
            }
            for (const index of indices) {
                allIndices.push(index);
                grid.cells[index].hasShip = true;
                ship.cells[index] = grid.cells[index];
            }
            ship.indices = indices;
            break;
        }
    }
}

function startGame() {
    createGrid();
    placeShips(grid, ships);
    message("5 ships remaining");

    // for (let ship of ships) {
    //     for (let index of ship.indices) {
    //         grid.cells[index].element.innerHTML = ship.size;
    //     }
    // }
}

document.addEventListener('DOMContentLoaded', startGame);
