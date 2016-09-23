var chess = require("./chess");

chess.config({
    path: "../img/"
});
chess.init();

document.querySelector("button").onclick = function(){
    chess.reset();
};
