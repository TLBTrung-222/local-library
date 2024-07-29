const session = require('express-session');
const MongoStore = require('connect-mongo');

// we save the session to mongodb => connect-mongo
const sessionConfig = session({
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
});

module.exports = sessionConfig;
