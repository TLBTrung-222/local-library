const mongoose = require('mongoose');
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
    book: {
        type: Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
        default: 'Maintenance',
    },
    imprint: { type: String, required: true },
    due_back: { type: Date, default: Date.now },
});

BookInstanceSchema.virtual('url').get(function () {
    return `/catalog/bookinstance/${this._id}`;
});

// format the date to
BookInstanceSchema.virtual('due_back_formatted').get(function () {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

BookInstanceSchema.virtual('due_back_yyyy_mm_dd').get(function () {
    return DateTime.fromJSDate(this.due_back).toISODate(); //format 'YYYY-MM-DD'
});

module.exports = mongoose.model('BookInstance', BookInstanceSchema);
