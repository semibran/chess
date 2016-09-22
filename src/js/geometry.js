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
