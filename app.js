var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const catalogRouter = require('./routes/catalog');
const compression = require('compression');
const helmet = require('helmet');
const RateLimimt = require('express-rate-limit');
require('./config/db.config'); // connect to database

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap and Jquery to be served
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
        },
    })
);
// Set up rate limiter: maximum of 30 requests per minute
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
});
// Apply rate limiter to all requests
app.use(limiter);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', { err });
});

module.exports = app;
