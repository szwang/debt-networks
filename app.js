var express = require('express');
var path = require('path');

var app = express();

app.use(express.static(path.join(__dirname, 'public')))

var port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log('App listening on port ' + port);
});