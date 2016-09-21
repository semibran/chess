(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var board  = document.querySelector(".board"),
    size = 0,
    pieces = [],
    types = ["rook", "knight", "bishop", "queen", "king", "pawn"],
    mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function addEvent(type, callback) {
    if (!this) return;
    if (this.addEventListener) {
        this.addEventListener(type, callback, false);
    } else if (this.attachEvent) {
        this.attachEvent("on" + type, callback);
    } else {
        this["on" + type] = callback;
    }
}

function removeEvent(type, callback) {
    if (!this) return;
    if (this.removeEventListener) {
        this.removeEventListener(type, callback, false);
    } else if (this.detachEvent) {
        this.detachEvent("on" + type, callback);
    } else {
        this["on" + type] = null;
    }
}

function resize() {
    var dimensions = [Math.max(document.documentElement.clientWidth, window.innerWidth || 0), Math.max(document.documentElement.clientHeight, window.innerHeight || 0)];
    size = parseFloat(board.getBoundingClientRect().width);
    for (var i = pieces.length, p; p = pieces[-- i];) {
        p.update();
    }
}

function Piece(pos, type, color) {
    var piece = this, element;
    this.pos = pos;
    this.type = type;
    this.color = color;
    this.moved = false;
    this.element = element = document.createElement("div");
    this.element.className = "piece "+color+" "+type;
    function start(event) {
        var rect = board.getBoundingClientRect(),
            input, inputEnd, offset, pos, initTile, tile, lastTile;

        if (mobile) {
            offset = [size / 8 / 2, size / 8 / 2];
            input = "touch";
            inputEnd = "end";
        } else {
            offset = [event.offsetX, event.offsetY];
            input = "mouse";
            inputEnd = "up";
        }

        function getPos(event) {
            return [event.pageX - rect.left, event.pageY - rect.top];
        }
        function getTile(event) {
            var posTemp, x, y;
            if (event) {
                if (event.constructor.name === "Array") {
                    posTemp = event;
                } else {
                    pos = posTemp = getPos(event);
                }
            } else {
                posTemp = pos;
            }
            x = Math.floor(posTemp[0] / (size / 8));
            y = Math.floor(posTemp[1] / (size / 8));
            if (x < 0 || x > 7) x = null;
            if (y < 0 || y > 7) y = null;
            return [x, y];
        }
        function getSquare(x, y) {
            if (x.constructor.name === "Array") {
                y = x[1];
                x = x[0];
            }
            if (x < 0 || x > 7) x = null;
            if (y < 0 || y > 7) y = null;
            return x !== null && y !== null ? board.children[y].children[x] : null;
        }

        function move(event) {
            if (tile) {
                if (!lastTile) lastTile = [];
                lastTile[0] = tile[0];
                lastTile[1] = tile[1];
            }
            pos = getPos(event);
            tile = getTile();
            piece.pos[0] = (pos[0] - offset[0]) / (size / 8);
            piece.pos[1] = (pos[1] - offset[1]) / (size / 8);
            // alert(piece.pos);
            piece.update();
            if (lastTile) {
                if (tile[0] != lastTile[0] || tile[1] != lastTile[1]) {
                    var lastSquare = getSquare(lastTile),
                        square     = getSquare(tile),
                        friend     = null,
                        name;
                    if (lastSquare)
                        lastSquare.classList.remove("active", "friend", "foe");
                    if (square) {
                        square.classList.add("active");
                        for (var i = pieces.length, p; p = pieces[-- i];) { // Iterate through pieces
                            if (p.pos[0] == tile[0] && p.pos[1] == tile[1]) { // If piece tile is already taken:
                                friend = p.color === piece.color;
                                break;
                            }
                        }

                        if (friend === true) {
                            name = "friend";
                        } else if (friend === false) {
                            name = "foe";
                        }

                        if (name)
                            square.classList.add(name);
                    }
                }
            }
            event.preventDefault();
        }

        function end(event) {
            removeEvent.call(document, input + "move", move);
            removeEvent.call(document, input + inputEnd, end);
            if (tile[0] !== null && tile[1] !== null) {
                getSquare(tile).classList.remove("active");
                for (var i = pieces.length, p; p = pieces[-- i];) { // Iterate through pieces
                    if (p.pos[0] == tile[0] && p.pos[1] == tile[1]) { // If piece tile is already taken:
                        if (p.color !== piece.color) { // If piece is an enemy:
                            // Move is valid; capture the opposing piece.
                            board.removeChild(p.element);
                            pieces.splice(i, 1);
                            piece.moved = true;
                        } else {
                            // Move is invalid; revert to initial tile
                            tile = initTile;
                        }
                        break;
                    }
                }
            } else {
                tile = initTile;
            }
            piece.element.classList.remove("active");
            piece.pos = tile;
            piece.update();
            event.preventDefault();
        }

        move(event);

        addEvent.call(document, input + "move", move);
        addEvent.call(document, input + inputEnd, end);
        initTile = tile;
        getSquare(tile).classList.add("active");
        piece.element.classList.add("active");

        event.preventDefault();
    }
    addEvent.call(this.element, "touchstart", start);
    addEvent.call(this.element, "mousedown",  start);
    // this.element.ontouchstart = start;
    // this.element.onmousedown = start;

    this.element.ondragstart = function() {
        return false;
    };
}

Piece.prototype.init = function() {
    board.appendChild(this.element);
    pieces.push(this);
    this.update();
    return this;
};

Piece.prototype.update = function() {
    this.element.style.left = this.pos[0] * size / 8 + "px";
    this.element.style.top  = this.pos[1] * size / 8 + "px";
    return this;
}

var type, color;
for (var y = 8; y --;) {
    for (var x = 8; x --;) {
        type = null;
        color = null;
        if (y == 0 || y == 7) {
            if (x == 0 || x == 7)
                type = "rook";
            if (x == 1 || x == 6)
                type = "knight";
            if (x == 2 || x == 5)
                type = "bishop";
            if (x == 3)
                type = "queen";
            if (x == 4)
                type = "king";
        }
        if (y <= 1) {
            color = "black";
            if (y == 1)
                type = "pawn";
        }
        if (y >= 6) {
            color = "white";
            if (y == 6)
                type = "pawn";
        }
        type && color && new Piece([x, y], type, color).init();
    }
}

resize();
addEvent("resize", resize);
addEvent("orientationchange", resize);

},{}]},{},[1])