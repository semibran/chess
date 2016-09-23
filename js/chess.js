(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./geometry":2}],2:[function(require,module,exports){
module.exports = (function(){
    function Vector(x, y){
        this.x = x;
        this.y = y;
    }

    Vector.resolve = function(x, y) {
        if (typeof y === "undefined") {
            var t = typeof x;
            if (x instanceof Vector) {
                y = x.y;
                x = x.x;
            } else if (typeof x === "number") {
                y = 0;
            }
        }
        return {x: x, y: y};
    }

    Vector.prototype = {
        resolve:    Vector.resolve,
        add:        function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            this.x += x;
            this.y += y;
            return this;
        },
        added:      function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            return new Vector(this.x + x, this.y + y);
        },
        subtract:   function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            this.x -= x;
            this.y -= y;
            return this;
        },
        subtracted: function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            return new Vector(this.x - x, this.y - y);
        },
        multiply: function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            this.x *= x;
            this.y *= y;
            return this;
        },
        multiplied: function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            return new Vector(this.x * x, this.y * y);
        },
        divide: function(x, y) {
            o = Vector.resolve(x, y);
            this.x /= o.x;
            this.y /=o. y;
            return this;
        },
        divided: function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            return new Vector(this.x / x, this.y / y);
        },
        dot: function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            return this.x * x + this.y * y;
        },
        clone: function() {
            return new Vector(this.x, this.y);
        },
        set: function(x, y){
            o = Vector.resolve(x, y);
            this.x = o.x;
            this.y = o.y;
            return this;
        },
        equals: function(x, y){
            if (x === null) return false;
            o = Vector.resolve(x, y);
            return this.x == o.x && this.y == o.y;
        },
        floor : function() {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            return this;
        },
        floored : function() {
            return new Vector(Math.floor(this.x), Math.floor(this.y));
        },
        round : function() {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        },
        rounded : function() {
            return new Vector(Math.round(this.x), Math.round(this.y));
        },
        scale: function(scalar) {
            this.x *= scalar;
            this.y *= scalar;
            return this;
        },
        scaled: function(scalar) {
            return new Vector(this.x * scalar, this.y * scalar);
        },
        string: function(){
            return this.x+", "+this.y;
        }
    }

    function Rect(x, y, width, height){

        var pos, size;

        if (typeof width !== "undefined" && typeof height !== "undefined"){
            pos  = new Vector(x, y);
            size = new Vector(width, height);
        } else {
            pos = x;
            size = y;
        }

        this.pos = pos;
        this.size = size;

        var property, obj;

        for (property in this.properties) {
            obj = this.properties[property];
            Object.defineProperty(this, property, obj);
        }
    }

    Rect.prototype = {
        properties: {
            "left": {
                get: function(){
                    return this.pos.x;
                },
                set: function(value){
                    this.pos.x = value;
                }
            },
            "right": {
                get: function(){
                    return this.pos.x + this.size.x;
                },
                set: function(value){
                    this.pos.x = value - this.size.x;
                }
            },
            "top": {
                get: function(){
                    return this.pos.y;
                },
                set: function(value){
                    this.pos.y = value;
                }
            },
            "bottom": {
                get: function(){
                    return this.pos.y + this.size.y;
                },
                set: function(value){
                    this.pos.y = value - this.size.y;
                }
            },
            "x": {
                get: function(){
                    return this.pos.x;
                },
                set: function(value){
                    this.pos.x = value;
                }
            },
            "y": {
                get: function(){
                    return this.pos.y;
                },
                set: function(value){
                    this.pos.y = value;
                }
            },
            "width": {
                get: function(){
                    return this.size.x;
                },
                set: function(value){
                    this.size.x = value;
                }
            },
            "height": {
                get: function(){
                    return this.size.y;
                },
                set: function(value){
                    this.size.y = value;
                }
            },
            "center": {
                get: function(){
                    return new geometry.Vector(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
                },
                set: function(value){
                    this.pos.x = value.x - this.size.x / 2;
                    this.pos.y = value.y - this.size.y / 2;
                }
            }
        },
        added:      function(x, y) {
            o = Vector.resolve(x, y);
            x = o.x;
            y = o.y;
            return new Rect(this.pos.x + x, this.pos.y + y, this.size.x, this.size.y);
        },
        clone:      function() {
            return new Rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        },
        set:        function(x, y, width, height) {
            if (x instanceof Rect) {
                this.pos.x  = x.pos.x;
                this.pos.y  = x.pos.y;
                this.size.x = x.size.x;
                this.size.y = x.size.y;
                return;
            }
            this.pos.x = x;
            this.pos.y = y;
            this.size.x = width;
            this.size.y = height;
        },
        intersects: function(other) {
            if (other instanceof Vector) {
                return this.left < other.x && this.right > other.x && this.top < other.y && this.bottom > other.y;
            } else if (other instanceof Rect) {
                return this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top;
            } else {
                return false;
            }
        },
        contains: function(other) {
            if (other instanceof Vector) {
                return other.x > this.left && other.x < this.right && other.y > this.top && other.y < this.bottom;
            } else if (other instanceof Rect) {
                return other.left > this.left && other.right < this.right && other.top > this.top && other.bottom < this.bottom;
            } else {
                return false;
            }
        },
        string: function(){
            return this.left+" -> "+this.right+", "+this.top+" -> "+this.bottom;
        }
    };

    return {
        Vector: Vector,
        Rect: Rect
    };
})();

},{}]},{},[1])