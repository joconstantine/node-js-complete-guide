const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin');

router.get('/add-product', adminController.getAddProduct);

router.get('/products', adminController.getProducts);

router.post('/add-product',
    [
        body('title', 'Please enter a valid Title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price', 'Please enter a valid Price')
            .isFloat(),
        body('description', 'Please enter a valid Description')
            .isLength({ min: 5, max: 400 })
            .trim(),
    ]
    , adminController.postAddProduct
);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product',
    [
        body('title', 'Please enter a valid Title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price', 'Please enter a valid Price')
            .isFloat(),
        body('description', 'Please enter a valid Description')
            .isLength({ min: 5, max: 400 })
            .trim(),
    ]
    , adminController.postEditProduct
);

router.delete('/product/:productId', adminController.postDeleteProduct);

module.exports = router;