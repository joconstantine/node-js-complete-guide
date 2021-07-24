const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fileHelper = require('../util/file');

const Product = require('../models/product');
exports.getAddProduct = (req, res, next) => {
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
    // if (!req.session.isLoggedIn) {
    //     return res.redirect('/login');
    // }
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            errorMessage: 'Attached file is not an image.',
            product: {
                ...req.body,
            },
            validationErrors: [],
        });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                ...req.body,
            },
            validationErrors: errors.array(),
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.session.user,
    });
    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error); //express will skip other middlewares and go to the error handler
            // return res.redirect('/500');
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                hasError: false,
                product: product,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);

    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            product: {
                ...req.body,
                _id: prodId,
            },
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            if (image) { // if a new image is updated
                // delete the old image
                // fire and forget
                fileHelper.deleteFile(product.imageUrl);

                // set the new imageUrl
                product.imageUrl = image.path;
            }
            return product.save()
                .then(result => {
                    console.log('UPDATED PRODUCT!');
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });

}

exports.getProducts = (req, res, next) => {
    console.log(req.user._id);
    Product.find({ userId: req.user._id })
        .populate('userId')
        .then(products => {
            console.log(products);
            res.render('admin/products', {
                prods: products, pageTitle: 'Admin Products',
                path: '/admin/products',
                activeShop: true,
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found.'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.status(200).json({
                message: "Success!",
            });
        })
        .catch(err => {
            res.status(500).json({
                message: "Deleting product failed.",
            });
        });
};