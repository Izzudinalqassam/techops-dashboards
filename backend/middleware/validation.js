const { body, query, param, validationResult } = require('express-validator');

// Input validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessage = errors.array().map(error => `${error.path}: ${error.msg}`).join(', ');
    
    return res.status(400).json({
      error: 'Validation Error',
      message: `Validation failed: ${errorMessage}`,
      details: {},
      validationErrors: errors.array()
    });
  }
  next();
};

// User registration validation rules
const userRegistrationValidation = [
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 1-50 characters and contain only letters and spaces'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 1-50 characters and contain only letters and spaces'),
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8-128 characters with at least one lowercase, uppercase, number, and special character'),
];

// User login validation rules
const userLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password is required')
];

// ID parameter validation
const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

module.exports = {
  handleValidationErrors,
  userRegistrationValidation,
  userLoginValidation,
  idParamValidation,
  body,
  query,
  param
};