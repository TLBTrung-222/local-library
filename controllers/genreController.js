const Genre = require('../models/genre');
const Book = require('../models/book');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
    const genreList = await Genre.find({}).exec();
    res.render('genre_list', { genreList });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
    const [genre, bookWithGenre] = await Promise.all([
        Genre.findById(req.params.id),
        Book.find({
            genre: req.params.id,
        }),
    ]);
    if (genre === null) {
        // No results.
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }
    res.render('genre_detail', { genre, books: bookWithGenre });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
    res.render('genre_form', { title: 'Create genre' });
});

// Handle Genre create on POST.
exports.genre_create_post = [
    body('name', 'Name must contains at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape(), // escaped all character to prevent XSS attack

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);
        const genre = new Genre({ name: req.body.name });

        // There are errors. Render the form again with sanitized values/error messages.
        if (!errors.isEmpty()) {
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array(),
            });
        } else {
            const genreExists = await Genre.findOne({ name: req.body.name })
                .collation({ locale: 'en', strength: 2 })
                .exec();
            // if the genre with name already exist, redirect user to that genre
            if (genreExists) {
                res.redirect(genreExists.url);
            } else {
                await genre.save();
                res.redirect(genre.url);
            }
            res.render('genre_form', { title: 'Create Genre', genre: genre });
        }
    }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre delete GET');
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre delete POST');
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre update GET');
});

// Handle Genre update on POST.
exports.genre_update_post = asyncHandler(async (req, res, next) => {
    res.send('NOT IMPLEMENTED: Genre update POST');
});
