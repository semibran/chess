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
