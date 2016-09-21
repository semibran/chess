var board  = document.querySelector(".board"),
    size = 0,
    pieces = [],
    types = ["rook", "knight", "bishop", "queen", "king", "pawn"];

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
    size = parseFloat(board.clientWidth);
    for (var i = pieces.length, p; p = pieces[-- i];) {
        p.update();
    }
}

function Piece(pos, type, color) {
    var piece = this, element;
    this.pos = pos;
    this.type = type;
    this.color = color;
    this.element = element = document.createElement("div");
    this.element.className = "piece "+color+" "+type;
    this.element.onmousedown = function(event) {
        var offset = [event.offsetX, event.offsetY], pos, tile;
        var rect = board.getBoundingClientRect();
        piece.element.classList.add("active");
        function getPos(event) {
            return [event.pageX - rect.left, event.pageY - rect.top];
        }
        function getTile(event) {
            var posTemp;
            if (event) {
                if (event.constructor.name === "Array") {
                    posTemp = event;
                } else {
                    pos = posTemp = getPos(event);
                }
            } else {
                posTemp = pos;
            }
            return [Math.floor(posTemp[0] / (size / 8)), Math.floor(posTemp[1] / (size / 8))]
        }
        function mousemove(event) {
            pos = getPos(event);
            tile = getTile();
            piece.pos[0] = (pos[0] - offset[0]) / (size / 8);
            piece.pos[1] = (pos[1] - offset[1]) / (size / 8);
            piece.update();
        }
        function mouseup() {
            removeEvent.call(document, "mousemove", mousemove);
            removeEvent.call(document, "mouseup", mouseup);
            for (var i = pieces.length, p; p = pieces[-- i];) {
                if (p.pos[0] == tile[0] && p.pos[1] == tile[1]) {
                    board.removeChild(p.element);
                    pieces.splice(i, 1);
                    break;
                }
            }
            piece.element.classList.remove("active");
            piece.pos = tile;
            piece.update();
            // console.log(board.children[tile[0]].children[tile[1]]);
        }
        mousemove(event);
        addEvent.call(document, "mousemove", mousemove);
        addEvent.call(document, "mouseup", mouseup);
    }
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
