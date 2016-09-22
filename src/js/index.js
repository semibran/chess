var chess = require("./chess");

chess.init();

document.querySelector("button").onclick = function(){
    chess.reset();
};
