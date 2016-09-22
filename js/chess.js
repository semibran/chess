(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function() {
    var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    function addEvent(type, callback) {
        if (!this) return;
        if (this.addEventListener) {
            this.addEventListener(type,  callback, false);
        } else if (this.attachEvent) {
            this.attachEvent("on" + type, callback);
        } else {
            this["on" + type] = callback;
        }
        return callback;
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
    mobile && document.body.classList.add("mobile");
    return {
        mobile: mobile,
        addEvent: addEvent,
        removeEvent: removeEvent
    };
})();

},{}],2:[function(require,module,exports){
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

},{"./dom":1,"./geometry":3}],3:[function(require,module,exports){
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

},{}]},{},[2])