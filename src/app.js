const express = require('express');
const morgan = require('morgan');
const path = require('path');
const exphbs = require('express-handlebars');
const app = express();
const { Storage } = require('@google-cloud/storage');

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use(require('./routes/index'));

app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.create({
    extname: '.hbs'
}).engine);

app.set('view engine', '.hbs');






app.use(express.static(path.join(__dirname,'public')));

module.exports = app; 