//_ ----------- Initialize app --------------------------------------------
var express = require('express');
require('./config/db.config'); // connect to database
var app = express();

var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const compression = require('compression');
const helmet = require('helmet');

//_ ----------- Use essential middlewares --------------------------------------------

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

//_ ----------- Session middleware ------------------------------------
// our server use session, so express-session come in handy
// we save the session to mongodb => connect-mongo
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(
    session({
        secret: 'local-library-session-secret',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            collectionName: 'session',
            mongoUrl: process.env.MONGO_URI,
            ttl: 5 * 60 * 60, // 5 hours (in s)
        }),
        cookie: {
            maxAge: 5 * 60 * 60 * 1000, // 5 hours (in ms)
            httpOnly: true,
        },
    })
);

//_ ----------- Authenticate middleware ------------------------------------
// use configured passport middleware
const passport = require('./config/passport');

app.use(passport.initialize());
app.use(passport.session());

// pass isAuthenticated and currentUser to all views using res.locals
app.use((req, res, next) => {
    // Delete salt and hash fields from req.user object before passing it.
    if (req.user) {
        // we want to exclude salt and hash
        res.locals.isAuthenticated = req.isAuthenticated;
        
        // Create a deep copy of req.user to avoid modifying the original object.
        const safeUser = req.user ? JSON.parse(JSON.stringify(req.user)) : null;
        // remember that req.user is document from mongoose so to delete direct
        // we need to use _doc property: delete req.user._doc.salt
        if (safeUser) {
            delete safeUser.salt;
            delete safeUser.hash;
        }
        res.locals.current_user = safeUser;
    }
    return next();
});

//_ ----------- Handle routers --------------------------------------------
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const auth = require('./lib/auth');

app.use(auth);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

//_ ----------- Error handler --------------------------------------------
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
