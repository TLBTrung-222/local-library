const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const { notEmptyField } = require('../utils/validation');
const { body, validationResult } = require('express-validator');

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate('book').exec();
    console.log(JSON.stringify(allBookInstances[0], null, 2));
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
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate('book')
        .exec();
    console.log(JSON.stringify(bookInstance, null, 2));
    if (bookInstance === null) {
        // No results.
        res.redirect('/catalog/bookinstances');
    }

    res.render('bookinstance_delete', {
        title: 'Delete BookInstance',
        bookinstance: bookInstance,
    });
});

// Handle BookInstance delete on POST.
// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    // Assume valid BookInstance id in field.
    await BookInstance.findByIdAndDelete(req.body.id);
    res.redirect('/catalog/bookinstances');
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
});
