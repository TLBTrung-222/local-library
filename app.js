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

//_ ----------- Use middlewares --------------------------------------------

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

//_ ----------- Authenticate middleware ------------------------------------
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const session = require('express-session');
const MongoStore = require('connect-mongo');

//_ configure passport middleware
// create local strategy
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username }).exec();

            if (!user) {
                return done(null, false, { message: 'Wrong username' });
            }
            if (!user.validatePassword(password)) {
                return done(null, false, { message: 'Wrong password' });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    })
);
// serialize and deserialize session (for userId)
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id).exec();
    if (!user) return done(err);
    return done(null, user);
});
// done configure passport, now use passport.authenticate to protect route

//_ we use session, so express-session come in handy
app.use(
    session({
        secret: 'local-library-session-secret',
        resave: false,
        saveUninitialized: false,
        store: new MongoStore({
            collectionName: 'session',
            mongoUrl: process.env.MONGO_URI,
            ttl: 7 * 24 * 60 * 60, // 7 days. 14 Default.
        }),
    })
);

app.use(passport.initialize());
app.use(passport.session());

//_ ----------- Handle routers --------------------------------------------
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');
const auth = require('./lib/auth');

app.use(auth);

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
