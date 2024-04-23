const express = require('express')
// note: Express router always keeps the params separate, we have to set mergeParams to be true to get access to the params, otherwise read null Error
const router = express.Router({ mergeParams: true });
const Campground = require('../models/campground');
const Review = require('../models/review')
const catchAsync = require('../utils/catchAsync')
const ExpressError = require('../utils/ExpressError')
const {validateReview, isLoggedIn, isReviewAuthor} = require('../middleware');
const reviews = require('../controllers/reviews') // in this way, variable campgrounds  has multiple exported methods







// 这个req是从 show.ejs中的form(创建review) 提交上来的
router.post('/',isLoggedIn,validateReview, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn,isReviewAuthor,catchAsync(reviews.deleteReview))

module.exports = router;



