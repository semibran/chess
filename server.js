const http    = require("http"),
      express = require("express"),
      port    = 8080,
      ip      = "127.0.0.1";

var app = express(),
    server = http.Server(app);

app.use("/", express.static("dist"));
app.get("/", (req, res) => {
    res.sendFile("./dist/index.html");
});

function callback() {
    console.log("Server listening at",port);
}

server.listen(port, ip, callback);
