// 'use strict' ?

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
    document.querySelector('#messageField').innerHTML = string;
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
            }
            if (!gameOver) message(`Sunk the ${theShip.name}!`);
            let sorted = theShip.indices.sort((a, b) => a - b);
            let first = sorted[0], last = sorted[sorted.length-1];

            if (theShip.isHorizontal) {
                for (let i = first - grid.size - 1; i < last - grid.size + 2; i++) {
                    if (i >= 0 && i < 100) {
                        const element = grid.cells[i].element;
                        element.classList.add('miss');
                        document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                    }
                }
                for (let i = first + grid.size - 1; i < last + grid.size + 2; i++) {
                    if (i >= 0 && i < 100) {
                        const element = grid.cells[i].element;
                        element.classList.add('miss');
                        document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                    }
                }
                if (first - 1 >= 0) {
                    const element = grid.cells[first-1].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
                if (last + 1 < 100) {
                    const element = grid.cells[last+1].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
            } else {
                for (const index of sorted) {
                    let indexBefore = index - 1;
                    let indexAfter = index + 1;
                    if (indexBefore >= 0 && indexBefore % grid.size != 9) {
                        const element = grid.cells[indexBefore].element;
                        element.classList.add('miss');
                        document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                    }
                    if (indexAfter < 100 && indexAfter % grid.size != 0) {
                        const element = grid.cells[indexAfter].element;
                        element.classList.add('miss');
                        document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                    }
                }

                let indexFirst = first - grid.size;
                if (indexFirst >= 0) {
                    const element = grid.cells[indexFirst].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
                if (indexFirst - 1 >= 0 && (indexFirst - 1) % grid.size != 9) {
                    const element = grid.cells[indexFirst - 1].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
                if (indexFirst + 1 >= 0 && (indexFirst + 1) % grid.size != 0) {
                    const element = grid.cells[indexFirst + 1].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }

                let indexLast = last + grid.size;
                if (indexLast >= 0) {
                    const element = grid.cells[indexLast].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
                if (indexLast - 1 && (indexLast - 1) % grid.size != 9) {
                    const element = grid.cells[indexLast - 1].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
                if (indexLast + 1 && (indexLast + 1) % grid.size != 0) {
                    const element = grid.cells[indexLast + 1].element;
                    element.classList.add('miss');
                    document.querySelector(`#${element.id} .imageMiss`).style.display = 'unset';
                }
            }
        }

        element.classList.add('hit');
        document.querySelector(`#cell-${id} > .imageHit`).style.display = 'unset';
        let hitCounter = document.querySelector('#hitCounter');
        hitCounter.innerHTML = Number(hitCounter.innerHTML) + 1;
    } else {
        element.classList.add('miss');
        document.querySelector(`#cell-${id} > .imageMiss`).style.display = 'unset';
        let missCounter = document.querySelector('#missCounter');
        missCounter.innerHTML = Number(missCounter.innerHTML) + 1;
    }

    grid.cells[id].hasShot = true;
}

function createGrid() {
    // TODO don't add so many elements unnecessarily
    const gameBoard = document.querySelector('.gameBoard');

    for (let i = 0; i < grid.size ** 2; i++) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.id = `cell-${i}`;
        cellDiv.dataset.id = i;
        cellDiv.addEventListener("click", doShot);
        gameBoard.appendChild(cellDiv);

        const hitDiv = document.createElement('div');
        hitDiv.className = 'imageHit';
        hitDiv.style.display = 'none';
        cellDiv.appendChild(hitDiv);

        const missDiv = document.createElement('div');
        missDiv.className = 'imageMiss';
        missDiv.style.display = 'none';
        cellDiv.appendChild(missDiv);

        const cell = new Cell(cellDiv);
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

    for (let ship of ships) {
        for (let index of ship.indices) {
            // grid.cells[index].element.innerHTML = ship.size;
        }
    }
}

document.addEventListener('DOMContentLoaded', startGame);