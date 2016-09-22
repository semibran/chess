module.exports = (function() {
    var geometry = require("./geometry"),
        dom = require("./dom"),
        board = document.querySelector(".board"),
        boardSize = 0,
        squareSize = 0,
        state = {
            pieces: null,
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
        this.pos = null;
        this.posInit = pos.clone();
        this.square = null;
        this.type = type;
        this.color = color;
        this.moved = null;
        this.listener = null;
        this.element = element = document.createElement("div");
        this.element.className = "piece "+color+" "+type;
    }

    Piece.prototype = {
        init: function(){
            state.pieces.push(this);
            this.reset();
            dom.addEvent.call(this.element, "dragstart",  function() {
                return false;
            }, this);
            return this;
        },
        reset: function() {
            this.moved = false;
            this.pos = this.posInit.clone();
            this.square = getSquare(this.pos);
            if (this.element.parentNode)
                this.element.parentNode.removeChild(this.element);
            this.square.appendChild(this.element);
            this.listen();
            return this;
        },
        listen: function() {
            var piece = this;
            this.listener = function(event) {
                var rect = board.getBoundingClientRect(),
                    input, inputEnd, offset, pos, initTile, tile, lastTile;

                // console.log("Click!");

                if (!piece.element.classList.contains("active")) {

                    if (piece.element.classList.contains("transit")) {
                        piece.element.classList.remove("transit");
                        clearTimeout(piece.timeout);
                    }

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
                                        if (tile.equals(p.pos)) { // If piece tile is already taken:
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
                                if (tile.equals(p.pos)) { // If piece tile is already taken:
                                    if (p.color !== piece.color) { // If piece is an enemy:
                                        // Move is valid; capture the opposing piece.
                                        p.unlisten();
                                        document.querySelector(".captured .row."+p.color).appendChild(getSquare(p.pos).removeChild(p.element));
                                        p.pos = null;
                                        p.square = null;
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
                        piece.callback = function(moving){

                            piece.square = getSquare(tile);
                            if (piece.element.parentNode === board)
                                board.removeChild(piece.element);
                            piece.square.appendChild(piece.element);
                            piece.element.classList.remove("transit");
                            piece.element.style.left = 0;
                            piece.element.style.top = 0;
                            piece.timeout = null;
                            piece.callback = null;
                        }
                        piece.timeout = setTimeout(piece.callback, 250);
                        event.preventDefault();
                    }

                    move(event);

                    dom.addEvent.call(document, input + "move", move);
                    dom.addEvent.call(document, input + inputEnd, end);
                    initTile = tile;
                    getSquare(tile).classList.add("active");
                    piece.element.classList.add("active");

                    if (piece.element.parentNode === piece.square)
                        board.appendChild(piece.square.removeChild(piece.element));
                }
                event.preventDefault();
            }
            dom.addEvent.call(this.element, "touchstart", this.listener);
            dom.addEvent.call(this.element, "mousedown",  this.listener);
            return this;
        },
        unlisten: function() {
            dom.removeEvent.call(this.element, "touchstart", this.listener);
            dom.removeEvent.call(this.element, "mousedown",  this.listener);
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
            if (!state.pieces) {
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
            } else {
                for (var i = state.pieces.length, p; p = state.pieces[-- i];) {
                    p.reset();
                }
            }
        },
        Piece: Piece
    };
})();
