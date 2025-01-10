'use strict';

class Cell {
    constructor(element, index) {
        this.element = element;
        this.hasShot = false;
        this.index = index;
    }
}

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
        this.indices = [];
    }
}

let gameOver = false;
let grid;
let ships;

// TODO put in top right corner, fade/slideout animation on timeout
// Persist for maybe 3 seconds
function message(string) {
    document.querySelector('#messageField').innerHTML = string;
}

function setMiss(i) {
    if (i < 0 || i >= 100) return;
    registerMiss(grid.cells[i], false);
}

function markWon() {
    message("You win!")
    gameOver = true;
    for (const cell of grid.cells) {
        cell.element.tabIndex = -1;
        // cell.style.pointerEvents = 'none';
    }
    const replayButton = document.querySelector('#replayButton');
    replayButton.style.display = 'unset';
}

function markSunk(ship) {
    ship.sunk = true;
    if (ships.every(ship => ship.sunk)) {
        markWon();
    } else {
        message(`Sunk the ${ship.name}`);
    }
    const first = ship.indices[0];
    const last = ship.indices[ship.indices.length-1];

    if (ship.isHorizontal) {
        for (let i = first - grid.size; i <= last - grid.size; i++) {
            setMiss(i);
        }
        for (let i = first + grid.size; i <= last + grid.size; i++) {
            setMiss(i);
        }
        if (first % grid.size != 0) {
            setMiss(first - 1);
            setMiss(first - 1 - grid.size);
            setMiss(first - 1 + grid.size);
        }
        if (last % grid.size != 9) {
            setMiss(last + 1);
            setMiss(last + 1 - grid.size);
            setMiss(last + 1 + grid.size);
        }
    } else { // is vertical
        for (const index of ship.indices) {
            if (index % grid.size != 0) setMiss(index - 1);
            if (index % grid.size != 9) setMiss(index + 1);
        }

        const indexFirst = first - grid.size;
        const indexLast = last + grid.size;

        setMiss(indexFirst);
        setMiss(indexLast);

        if (first % grid.size != 0) {
            setMiss(indexFirst - 1);
            setMiss(indexLast - 1);
        }
        if (first % grid.size != 9) {
            setMiss(indexFirst + 1);
            setMiss(indexLast + 1);
        }
    }
}

function registerHit(cell) {
    cell.element.classList.add('hit');
    document.querySelector(`#cell-${cell.index} > .imageHit`).style.display = 'unset';
    const hitCounter = document.querySelector('#hitCounter');
    hitCounter.innerHTML = Number(hitCounter.innerHTML) + 1;
}

function registerMiss(cell, incrementCounter=true) {
    cell.element.classList.add('miss');
    document.querySelector(`#cell-${cell.index} > .imageMiss`).style.display = 'unset';
    if (incrementCounter) {
        const missCounter = document.querySelector('#missCounter');
        missCounter.innerHTML = Number(missCounter.innerHTML) + 1;
    }
}

function doShot(event) {
    if (gameOver) return;

    const element = event.currentTarget;
    const id = Number(element.dataset.id);
    const cell = grid.cells[id];

    if (cell.hasShot) {
        return;
    }
    cell.hasShot = true;

    const ship = ships.find(ship => ship.indices.includes(id));
    if (ship) {
        if (ship.indices.every(index => grid.cells[index].hasShot)) {
            markSunk(ship);
        }

        registerHit(cell);
    } else {
        registerMiss(cell);
    }
}

function makeGrid() {
    // TODO simplify this. can probably get away with one or two divs instead of
    // three by using CSS classes correctly
    const gameBoard = document.querySelector('.gameBoard');
    grid = new Grid();

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

        const cell = new Cell(cellDiv, i);
        grid.cells.push(cell);
    }
}

function placeShip(ship) {
    outer: while (true) {
        const isHorizontal = Math.random() < 0.5;
        const freeWidth = isHorizontal ? grid.size - ship.size : grid.size;
        const freeHeight = isHorizontal ? grid.size : grid.size - ship.size;
        const x = Math.floor(Math.random() * freeWidth);
        const y = Math.floor(Math.random() * freeHeight);
        const start = grid.size * y + x;
        const indices = [];
        for (let i = 0; i < ship.size; i++) {
            const increment = isHorizontal ? i : i * grid.size;
            const index = start + increment;
            const doesFit = ships.every(ship => ship.indices.every(existingIndex => {
                const xDiff = Math.abs(existingIndex % grid.size - index % grid.size);
                const yDiff = Math.abs(Math.floor(existingIndex/grid.size) - Math.floor(index/grid.size));
                return xDiff >= 2 || yDiff >= 2;
            }));
            if (!doesFit) continue outer;
            indices.push(index);
            ship.isHorizontal = isHorizontal;
        }
        ship.indices = indices;
        break;
    }
}

function makeShips() {
    ships = [
        new Ship("Carrier", 5),
        new Ship("Battleship", 4),
        new Ship("Cruiser", 3),
        new Ship("Submarine", 3),
        new Ship("Destroyer", 2)    
    ]
    for (const ship of ships) {
        placeShip(ship);
    }
}

function startGame() {
    makeGrid();
    makeShips();

    // for (const ship of ships) {
    //     for (const index of ship.indices) {
    //         grid.cells[index].element.style.background = 'blue';
    //     }
    // }
}

document.addEventListener('DOMContentLoaded', startGame);