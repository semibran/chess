module.exports = (function() {
    var geometry = require("./geometry"),
        $board = $(".board"),
        state = {
            pieces: null,
        },
        config = {
            path: "./"
        },
        files = "abcdefgh",
        ranks = "12345678",
        presets = {
            board: {
                size: 8
            },
            pieces: {
                P: "pawn",
                B: "bishop",
                N: "knight",
                R: "rook",
                Q: "queen",
                K: "king"
            },
            symbols: []
        },
        setup = "RNBQKBNRPPPPPPPP                                PPPPPPPPRNBQKBNR",
        mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    function getSquare(x, y) {
        if (x === null || y === null || x < 0 || x > 7 || y < 0 || y > 7) return null;
        if (x.constructor.name === "Object") {
            y = x.y;
            x = x.x;
        }
        return $($board[0].children[y].children[x]);
    }

    function Piece(pos, type, color) {
        this.pos = null;
        this.posInit = pos.clone();
        this.square = null;
        this.type = type;
        this.color = color;
        this.moved = null;
        this.listener = null;
        this.element = document.querySelector(".svg .chess.piece."+color+"."+type).cloneNode(true);
        this.$element = $(this.element);
        this.hitbox = this.element.querySelectorAll("path");
    }

    Piece.prototype = {
        init: function(){
            state.pieces.push(this);
            this.reset();
            return this;
        },
        reset: function() {
            this.moved = false;
            this.pos = this.posInit.clone();
            this.square = getSquare(this.pos);
            if (this.element.parentNode)
                this.element.parentNode.removeChild(this.element);
            this.square.append(this.element);
            this.listen();
            return this;
        },
        listen: function() {
            this.listener = function(event) {
                var size = $board.width() / presets.board.size,
                    piece = event.data.piece,
                    position = $board.offset(),
                    input, inputEnd, offset, pos, initTile, tile, lastTile;

                if (!piece.$element.hasClass("active")) {

                    if (piece.$element.hasClass("transit")) {
                        piece.$element.removeClass("transit");
                        clearTimeout(piece.timeout);
                    }

                    if (mobile) {
                        offset = new geometry.Vector(size / 2, size / 2);
                        input = "touch";
                        inputEnd = "end";
                    } else {
                        offset = new geometry.Vector(event.offsetX, event.offsetY);
                        input = "mouse";
                        inputEnd = "up";
                    }

                    function getPos(event) {
                        return new geometry.Vector(event.pageX - position.left, event.pageY - position.top);
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
                        x = Math.floor(posTemp.x / size);
                        y = Math.floor(posTemp.y / size);
                        if (x < 0 || x > 7) x = null;
                        if (y < 0 || y > 7) y = null;
                        return x !== null && y !== null ? new geometry.Vector(x, y) : null;
                    }

                    function move(event) {
                        var piece = event.data.piece;

                        if (tile) {
                            if (!lastTile) lastTile = [];
                            lastTile = tile.clone();
                        }
                        pos = getPos(event);
                        tile = getTile();
                        piece.pos = pos.subtracted(offset).scaled(1/size);
                        piece.update();
                        if (lastTile) {
                            if (!lastTile.equals(tile)) {
                                var lastSquare = getSquare(lastTile),
                                    square     = getSquare(tile),
                                    friend     = null,
                                    name;
                                if (lastSquare)
                                    $(lastSquare).removeClass("active", "friend", "foe");
                                if (square) {
                                    $(square).addClass("active");

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
                                        $(square).addClass(name);
                                }
                            }
                        }
                        event.preventDefault();


                    }

                    function end(event) {
                        var piece = event.data.piece;
                        $(document).off(input + "move", move).off(input + inputEnd, end)
                        if (tile) {
                            getSquare(tile).removeClass("active", "friend", "foe");
                            for (var i = state.pieces.length, p; p = state.pieces[-- i];) { // Iterate through pieces
                                if (tile.equals(p.pos)) { // If piece tile is already taken:
                                    if (p.color !== piece.color) { // If piece is an enemy:
                                        // Move is valid; capture the opposing piece.
                                        p.unlisten();
                                        $(".captured .row."+p.color)[0].appendChild(getSquare(p.pos)[0].removeChild(p.element));
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

                        piece.$element.removeClass("active");
                        piece.$element.addClass("transit");
                        piece.pos = tile;
                        piece.update();
                        piece.callback = function(moving){

                            piece.square = getSquare(tile);
                            if (piece.element.parentNode === $board[0])
                                $board[0].removeChild(piece.element);
                            piece.square.append(piece.element);
                            piece.$element.removeClass("transit");
                            piece.$element.css({
                                left: 0,
                                top: 0
                            });
                            piece.timeout = null;
                            piece.callback = null;
                        }
                        piece.timeout = setTimeout(piece.callback, 250);
                        event.preventDefault();
                    }

                    move(event);

                    $(document).on(input + "move", event.data, move).on(input + inputEnd, event.data, end);
                    initTile = tile;

                    getSquare(tile).addClass("active");
                    piece.$element.addClass("active");

                    if (piece.element.parentNode === piece.square[0])
                        $board[0].appendChild(piece.square[0].removeChild(piece.element));
                }
                event.preventDefault();
            }
            $(this.hitbox).on("mousedown touchstart", {piece: this}, this.listener);
            return this;
        },
        unlisten: function() {
            $(this.hitbox).off("mousedown touchstart", this.listener);
            return this;
        },
        update: function() {
            var size = $board.width() / presets.board.size;
            this.$element.css({
                left: this.pos.x * size,
                top: this.pos.y * size
            });
            return this;
        }
    };

    return {
        init: function() {
            this.reset();
        },
        reset: function() {
            this.parse(setup);
        },
        config: function(data) {
            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {
                    config[prop] = data[prop];
                }
            }
        },
        parse: function(data) {
            state.data = data;
            if (!state.pieces) {
                state.pieces = [];
                for (var i = 0, x, y, char, type, color; char = state.data[i]; i ++) {
                    x = i % presets.board.size;
                    y = (i - x) / presets.board.size;
                    type = presets.pieces[char];
                    color = y > presets.board.size / 2 ? "white" : "black";
                    type && new Piece(new geometry.Vector(x, y), type, color).init();
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
