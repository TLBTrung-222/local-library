const { body, validationResult } = require('express-validator');
const Author = require('../models/author');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
    const authorList = await Author.find().sort({ family_name: 1 }).exec();
    res.render('author_list', { authorList });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
    const [author, bookOfAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }).exec(),
    ]);
    res.render('author_detail', { author, books: bookOfAuthor });
});

// Display Author create form on GET.
// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
    res.render('author_form', { title: 'Create Author' });
};

// Handle Author create on POST.
exports.author_create_post = [
    // Validate and sanitize fields.
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters.'),
    body('family_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('Family name must be specified.')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    body('date_of_death', 'Invalid date of death')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('author_form', {
                title: 'Create Author',
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid.

            // Save author.
            await author.save();
            // Redirect to new author record.
            res.redirect(author.url);
        }
    }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
    const [author, booksFromAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }).sort({ title: 1 }).exec(),
    ]);
    res.render('author_delete', {
        title: 'Delete Author',
        author: author,
        booksFromAuthor: booksFromAuthor,
    });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
    const [author, booksFromAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }).sort({ title: 1 }).exec(),
    ]);

    // only allow to delete author if he has no book
    // otherwise warning user to delete all the book from this author first
    if (booksFromAuthor.length == 0) {
        await Author.findByIdAndDelete(req.body.author_id);
        res.redirect('/catalog/authors');
    } else {
        res.render('author_delete', {
            title: 'Delete Author',
            author: author,
            booksFromAuthor: booksFromAuthor,
        });
    }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id).exec();
    if (author === null) {
        // No results.
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
    }

    res.render('author_form', { title: 'Update Author', author: author });
});

// Handle Author update on POST.
exports.author_update_post = [
    // Validate and sanitize fields.
    body('first_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('First name has non-alphanumeric characters.'),
    body('family_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('Family name must be specified.')
        .isAlphanumeric()
        .withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),
    body('date_of_death', 'Invalid date of death')
        .optional({ values: 'falsy' })
        .isISO8601()
        .toDate(),

    // Process request after validation and sanitization.
    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
            _id: req.params.id,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('author_form', {
                title: 'Update Author',
                author: author,
                errors: errors.array(),
            });
            return;
        } else {
            // Data from form is valid. Update the record.
            await Author.findByIdAndUpdate(req.params.id, author);
            res.redirect(author.url);
        }
    }),
];
