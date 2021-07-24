const express = require('express');
const { check, body } = require('express-validator');
const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
    [
        body('email', 'Please enter a valid email.')
            .isEmail()
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(user => {
                        if (!user) {
                            return Promise.reject('Invalid email or password');
                        }

                        req.user = user;
                    });
            })
            .normalizeEmail(),
        body('password', 'Invalid email or password')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
    ]
    , authController.postLogin);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, { req }) => {
                if (value === 'test@test.com') {
                    throw new Error('This email address is forbidden.');
                }
                return User
                    .findOne({ email: value })
                    .then(userDoc => {
                        if (userDoc) {
                            return Promise.reject('Email exists already. Please pick a different one.');
                        }
                    });
            })
            .normalizeEmail(),
        body('password', 'Please enter a password with only numbers and text and at least 5 characters.')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match.');
                }
                return true;
            })
            .trim(),
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;