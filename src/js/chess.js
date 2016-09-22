module.exports = (function() {
    var geometry = require("./geometry"),
        dom = require("./dom"),
        board = document.querySelector(".board"),
        boardSize = 0,
        squareSize = 0,
        state = {
            pieces: [],
        },
        files = "abcdefgh",
        ranks = "12345678",
        types = [
            { name: "pawn",   symbol: "" },
            { name: "bishop", symbol: "B" },
            { name: "knight", symbol: "N" },
            { name: "rook",   symbol: "R" },
            { name: "queen",  symbol: "Q" },
            { name: "king",   symbol: "K" }
        ];

    function resize() {
        var dimensions = [Math.max(document.documentElement.clientWidth, window.innerWidth || 0), Math.max(document.documentElement.clientHeight, window.innerHeight || 0)];
        boardSize = parseFloat(board.getBoundingClientRect().width);
        squareSize = boardSize / 8;
        // for (var i = state.pieces.length, p; p = state.pieces[-- i];) {
        //     p.update();
        // }
    }

    function getSquare(x, y) {
        if (x === null || y === null || x < 0 || x > 7 || y < 0 || y > 7) return null;
        if (x.constructor.name === "Object") {
            y = x.y;
            x = x.x;
        }
        return board.children[y].children[x];
    }

    function Piece(pos, type, color) {
        this.pos = pos;
        this.square = getSquare(this.pos);
        this.type = type;
        this.color = color;
        this.moved = false;
        this.element = element = document.createElement("div");
        this.element.className = "piece "+color+" "+type;
    }

    Piece.prototype = {
        init: function(){
            var piece = this;
            state.pieces.push(this);
            this.square.appendChild(this.element);
            function start(event) {
                var rect = board.getBoundingClientRect(),
                    input, inputEnd, offset, pos, initTile, tile, lastTile;

                if (!piece.element.classList.contains("active") && !piece.element.classList.contains("transit")) {

                    if (dom.mobile) {
                        offset = new geometry.Vector(squareSize / 2, squareSize / 2);
                        input = "touch";
                        inputEnd = "end";
                    } else {
                        offset = new geometry.Vector(event.offsetX, event.offsetY);
                        input = "mouse";
                        inputEnd = "up";
                    }

                    function getPos(event) {
                        return new geometry.Vector(event.pageX - rect.left, event.pageY - rect.top);
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
                        x = Math.floor(posTemp.x / squareSize);
                        y = Math.floor(posTemp.y / squareSize);
                        if (x < 0 || x > 7) x = null;
                        if (y < 0 || y > 7) y = null;
                        return x !== null && y !== null ? new geometry.Vector(x, y) : null;
                    }

                    function move(event) {
                        if (tile) {
                            if (!lastTile) lastTile = [];
                            lastTile = tile.clone();
                        }
                        pos = getPos(event);
                        tile = getTile();
                        piece.pos = pos.subtracted(offset).scaled(1/squareSize);
                        piece.update();
                        if (lastTile) {
                            if (!lastTile.equals(tile)) {
                                var lastSquare = getSquare(lastTile),
                                    square     = getSquare(tile),
                                    friend     = null,
                                    name;
                                if (lastSquare)
                                    lastSquare.classList.remove("active", "friend", "foe");
                                if (square) {
                                    square.classList.add("active");
                                    for (var i = state.pieces.length, p; p = state.pieces[-- i];) { // Iterate through pieces
                                        if (p.pos.equals(tile)) { // If piece tile is already taken:
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
                        dom.removeEvent.call(document, input + "move", move);
                        dom.removeEvent.call(document, input + inputEnd, end);
                        if (tile) {
                            getSquare(tile).classList.remove("active", "friend", "foe");
                            for (var i = state.pieces.length, p; p = state.pieces[-- i];) { // Iterate through pieces
                                if (p.pos.equals(tile)) { // If piece tile is already taken:
                                    if (p.color !== piece.color) { // If piece is an enemy:
                                        // Move is valid; capture the opposing piece.
                                        getSquare(p.pos).removeChild(p.element);
                                        state.pieces.splice(i, 1);
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
                        piece.element.classList.add("transit");
                        piece.pos = tile;
                        piece.update();
                        setTimeout(function(){
                            piece.element.classList.remove("transit");
                            piece.square = getSquare(tile);
                            piece.square.appendChild(board.removeChild(piece.element));
                            piece.element.style = "";
                        }, 250);
                        event.preventDefault();
                    }

                    move(event);

                    dom.addEvent.call(document, input + "move", move);
                    dom.addEvent.call(document, input + inputEnd, end);
                    initTile = tile;
                    getSquare(tile).classList.add("active");
                    piece.element.classList.add("active");

                    board.appendChild(piece.square.removeChild(piece.element));
                }
                event.preventDefault();
            }
            dom.addEvent.call(piece.element, "touchstart", start);
            dom.addEvent.call(piece.element, "mousedown",  start);
            dom.addEvent.call(piece.element, "dragstart",  function() {
                return false;
            });
            return this;
        },
        update: function() {
            this.element.style.left = this.pos.x * squareSize + "px";
            this.element.style.top  = this.pos.y * squareSize + "px";
            return this;
        }
    };

    return {
        init: function() {
            this.reset();
            resize();
            dom.addEvent.call(window, "resize", resize);
            dom.addEvent.call(window, "orientationchange", resize);
        },
        reset: function() {
            for (var i = state.pieces.length, p; p = state.pieces[-- i];) {
                p.element.parentNode.removeChild(p.element);
            }
            state.pieces = [];
            var type, color;
            for (var y = 8; y --;) {
                for (var x = 8; x --;) {
                    type = null;
                    color = null;
                    if (y == 1 || y == 6) {
                        type = "pawn";
                    } else if (y == 0 || y == 7) {
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
                    color = y <= 1 ? "black" : "white";
                    type && color && new Piece(new geometry.Vector(x, y), type, color).init();
                }
            }
        },
        Piece: Piece
    };
})();
