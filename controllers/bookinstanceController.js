const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const { notEmptyField } = require('../utils/validation');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate('book').exec();

    res.render('bookinstance_list', {
        bookInstances: allBookInstances,
    });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id);

    const associatedBook = await Book.findById(bookInstance.book);
    res.render('bookinstance_detail', {
        bookInstance: {
            ...bookInstance.toObject(),
            associatedBook,
        },
    });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find().exec();
    const statusEnum = BookInstance.schema.path('status').enumValues;
    res.render('bookinstance_form', {
        title: 'Create Bookinstance',
        books: allBooks,
        possibleStatus: statusEnum,
    });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    notEmptyField('book', 'Book must not be empty'),
    notEmptyField('imprint', 'Imprint must not be empty'),
    body('due_back').isISO8601('yyyy-mm-dd').withMessage('Not a valid date'),
    notEmptyField('status', 'Status must not empty'),
    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const allBooks = await Book.find().exec();
        const statusEnum = BookInstance.schema.path('status').enumValues;

        const newBookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });
        if (!errors.isEmpty()) {
            console.table([
                ['default due back from js', newBookInstance.due_back],
                ['due back formatted', newBookInstance.due_back_formatted],
                ['due back ISO 8601', newBookInstance.due_back_yyyy_mm_dd],
            ]);
            res.render('bookinstance_form', {
                title: 'Create Bookinstance',
                books: allBooks,
                possibleStatus: statusEnum,
                bookInstance: newBookInstance,
                errors: errors.array(),
            });
        } else {
            await newBookInstance.save();
            res.redirect(newBookInstance.url);
        }
    }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: BookInstance delete GET');
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: BookInstance delete POST');
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
});
