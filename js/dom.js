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

},{}]},{},[1])