const Book = require('../models/book');
const Author = require('../models/author');
const BookInstance = require('../models/bookinstance');
const Genre = require('../models/genre');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');
const { notEmptyField } = require('../utils/validation');
const debug = require('debug')('book');

exports.index = asyncHandler(async (req, res, next) => {
    // display available book, copies, available copies, authors, genre

    const [numBooks, numAuthors, numCopies, numCopiesAvailable, numGenre] =
        await Promise.all([
            Book.countDocuments({}).exec(),
            Author.countDocuments({}).exec(),
            BookInstance.countDocuments({}).exec(),
            BookInstance.where({ status: 'Available' }).countDocuments().exec(),
            Genre.countDocuments({}).exec(),
        ]);

    res.render('index', {
        numBooks,
        numAuthors,
        numCopies,
        numCopiesAvailable,
        numGenre,
    });
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, 'title author')
        .sort({ title: 1 })
        .populate('author')
        .exec();
    const book = await Book.find({}).exec();
    res.render('book_list', { bookList: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id)
            .populate('genre')
            .populate('author')
            .exec(),
        BookInstance.find({ book: req.params.id }),
    ]);
    res.render('book_detail', {
        book,
        bookInstances,
    });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
    ]);

    res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres,
    });
});

// Handle book create on POST.

exports.book_create_post = [
    // make sure the genre is an array
    (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
            // if it not, convert the genre into an arary
            req.body.genre =
                typeof req.body.genre === undefined ? [] : [req.body.genre];
        }
        next();
    },
    notEmptyField('title', 'Title must not be empty.'),
    notEmptyField('author', 'Author must not be empty.'),
    notEmptyField('summary', 'Summary must not be empty.'),
    notEmptyField('isbn', 'ISBN must not be empty'),
    body('genre').isArray({ min: 1 }).withMessage('Genre must not be empty'),
    body('genre.*').escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const { title, author, summary, isbn, genre } = req.body;
        const newBook = new Book({
            title,
            author,
            summary,
            isbn,
            genre,
        });

        if (!errors.isEmpty()) {
            // render the form with incorrect value
            // so user know how stupid he is to fill that shit
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().sort({ family_name: 1 }).exec(),
                Genre.find().sort({ name: 1 }).exec(),
            ]);
            debug(`Error occur duing creating book: ${errors}`);
            res.render('book_form', {
                title: 'Create Book',
                authors: allAuthors,
                genres: allGenres,
                book: newBook,
                errors: errors.array(),
            });
        } else {
            // all information is correct
            await newBook.save();
            debug(
                `New book has been created: ${JSON.stringify(newBook, null, 2)}`
            );
            res.redirect(newBook.url);
        }
    }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Book delete GET');
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Book delete POST');
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
    ]);
    // now render the current book for pre-fill infor
    const currentBook = await Book.findById(req.params.id);
    res.render('book_form', {
        title: 'Update book',
        authors: allAuthors,
        genres: allGenres,
        book: currentBook,
    });
});

// Handle book update on POST.
exports.book_update_post = [
    // make sure the genre is an array
    (req, res, next) => {
        if (!Array.isArray(req.body.genre)) {
            // if it not, convert the genre into an arary
            req.body.genre =
                typeof req.body.genre === undefined ? [] : [req.body.genre];
        }
        next();
    },
    notEmptyField('title', 'Title must not be empty.'),
    notEmptyField('author', 'Author must not be empty.'),
    notEmptyField('summary', 'Summary must not be empty.'),
    notEmptyField('isbn', 'ISBN must not be empty'),
    body('genre').isArray({ min: 1 }).withMessage('Genre must not be empty'),
    body('genre.*').escape(),
    asyncHandler(async (req, res, next) => {
        const newBook = await Book.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: req.body.genre,
            },
            { new: true, runValidators: true }
        ); // {new: true} returns the updated document, {runValidators: true} enables validation

        res.redirect(newBook.url);
    }),
];
