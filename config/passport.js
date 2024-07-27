const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

//_ Register a strategy for later use when authenticating requests.
const verifyFunc = async (username, password, done) => {
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
};

const strategy = new LocalStrategy(verifyFunc);

passport.use('local', strategy);

//_ serialize and deserialize session
// serializeUser: decide what information will be kept on session (on mongodb)
passport.serializeUser((user, done) => {
    done(null, user._id);
});
// passport.session() retrieve session data from store
// deserialize use the session data (the one we pass from serializeUser)
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id).exec();
    if (!user) return done(err);
    return done(null, user);
});

module.exports = passport;
