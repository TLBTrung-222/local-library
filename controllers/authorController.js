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
exports.author_create_get = asyncHandler(async (req, res, next) => {
    res.render('author_form', { title: 'Create Author' });
});

// Handle Author create on POST.
exports.author_create_post = [
    body('first_name') // for req.body.first_name
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('Name has a non-alphanumeric character'),
    body('family_name')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage('First name must be specified.')
        .isAlphanumeric()
        .withMessage('Name has a non-alphanumeric character'),
    body('date_of_birth')
        .optional({
            values: 'falsy',
        })
        .isISO8601()
        .toDate(),
    body('date_of_death')
        .optional({
            values: 'falsy',
        })
        .isISO8601()
        .toDate(),
    asyncHandler(async (req, res, next) => {
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('author_form', {
                title: 'Create Author',
                author: author,
                errors: errors.array(),
            });
        } else {
            // we don't check if author exist, cuz many author can have same name
            await author.save();

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
    res.send('NOT IMPLEMENTED: Author update GET');
});

// Handle Author update on POST.
exports.author_update_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Author update POST');
});
