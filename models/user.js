// 1. create schema
// 2. define methods + url
// 3. compile to model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    // no need to fill in
    salt: {
        type: String,
        required: true,
        default: () => crypto.randomBytes(16).toString('hex'),
    },
    // no need to fill in
    hash: {
        type: String,
        required: true,
    },
    // no need to fill in
    role: {
        type: Number,
        enum: [0, 1, 2],
        default: 0,
    },
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
});

UserSchema.virtual('url').get(function () {
    return '/user/' + this._id;
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', function (next) {
    if (this.isModified('hash') || this.isNew) {
        // Check if the password has been modified or it's a new document
        try {
            this.salt = crypto.randomBytes(16).toString('hex');
            this.hash = crypto
                .pbkdf2Sync(this.hash, this.salt, 10000, 128, 'sha512')
                .toString('hex');
        } catch (error) {
            return next(error); // Pass error to next to handle it
        }
    }
    next();
});

// compare if user filled in correct password
UserSchema.methods.validatePassword = function (comparePassword) {
    const hashPassword = crypto
        .pbkdf2Sync(comparePassword, this.salt, 10000, 128, 'sha512')
        .toString('hex');
    return this.hash === hashPassword;
};

module.exports = mongoose.model('User', UserSchema);
