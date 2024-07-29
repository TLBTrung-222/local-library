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
    return '/users/' + this._id;
});

// need to call whenever save/update user
UserSchema.methods.setPassword = function (password) {
    // Create a salt for the user.
    this.salt = crypto.randomBytes(16).toString('hex');
    // Use salt to create hashed password.
    this.hash = crypto
        .pbkdf2Sync(password, this.salt, 10000, 128, 'sha512')
        .toString('hex');
};

// compare if user filled in correct password
UserSchema.methods.validatePassword = function (comparePassword) {
    const hashPassword = crypto
        .pbkdf2Sync(comparePassword, this.salt, 10000, 128, 'sha512')
        .toString('hex');
    return this.hash === hashPassword;
};

module.exports = mongoose.model('User', UserSchema);
