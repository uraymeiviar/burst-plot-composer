var express     = require('express');
var path        = require('path');
var http        = require('http');

var app         = express();
var router      = express.Router();

app.use('/', router);
app.use(express.static(path.join(__dirname, 'public')));

var httpServer = http.createServer(app);
httpServer.listen(8888);
