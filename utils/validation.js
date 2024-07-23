const { body } = require('express-validator');

/**
 * Creates a validation chain for a text field to ensure it is not empty.
 * The chain trims the field, checks for a minimum length of 1, and escapes any HTML characters to prevent XSS attacks.
 *
 * @param {string} fieldName - The name of the text field to validate.
 * @param {string} errorMessage - The error message to return if validation fails.
 */
const notEmptyField = (fieldName, errorMessage) => {
    return body(fieldName, errorMessage).trim().isLength({ min: 1 }).escape();
};

module.exports = { notEmptyField };
