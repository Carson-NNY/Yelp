// muddleware.js
//  validate, authorization各种的集合 
const { campgroundSchema,reviewSchema } = require('./schemas.js') // only for Joi  Schema
const ExpressError = require('./utils/ExpressError.js')
const Campground = require('./models/campground.js');
const Review = require('./models/review.js')

// note: 必须这种格式: module.exports.isLoggedIn = .... 
// 不懂
module.exports.isLoggedIn = (req, res, next) => {
    // passport helper method: req.isAuthenticated(), help us to see if the user already
    // logged in by checking the session content.  if authenticated, put next() to allow the rest of code to be implemented
    if (!req.isAuthenticated()) {
    //  store the url, so  that after successfully login, we can redirect the user back to where they were
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in')
        return res.redirect('/login');
    }
    next();
}

// new  Passport.js version will cause that session gets cleared after
// a successful login due to security reason. To resolve this issue, we will
// use a middleware function to transfer the returnTo value from the session 
//(req.session.returnTo) to the Express.js app res.locals object before the passport.authenticate() 
//function is executed in the /login POST route

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo; // use  res.locals to store req.session... content
    }
    next();
}




// Second layer error handle: 利用Joi工具(需要下载: npm i joi) 来进行数据提交前的validator, 和我们self define的 MongoDB schema不同 which 只对client 
//side(user)进行处理,  但是没有对于server side进行error处理(if we make some error directly in the URL or thrrught some
// request sending websites). 这种处理一般只处理对于data的新增or update(put | post)防止invalid data input  (或者处理一些之前的error handle方式处理不了的情况)
// 而且这里给出erro message更加方便. (针对于schema设计 throw相应的error提示)
// note: 我们把 主要code put 到schemas.js里面
module.exports.validateCampground = (req, res, next) => {
    // 这个 campgroundSchema 不是Mongo schema, 而是针对js的
    const { error } = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',') // 因为error 返回的detail有可能是array, 通过map()这里把他们join一起
        throw new ExpressError(msg, 400)
    } else {
        next(); // 这里允许我们没有error情况正常执行剩下的code
    }
}

// authorization: check the ownership of the campground  (still Second layer error handle)
module.exports.isAuthor = async(req,res, next)=>{
    const {id} = req.params;
   //we need to to verify if the current user is the owner of this campground
   // the code here is the second layer authtication protection (avoid hacker paste 
   // http://localhost:3000/campgrounds/6616c0c916cc69c2c5538d0b  and then add /edit to update the campground)
   const campground = await Campground.findById(id)
   if(!campground.author.equals(req.user._id)){
        req.flash('error','You do not have the permission to do this!')
        return res.redirect(`/campgrounds/${id}`)
   }
   next();
}
// authorization: check the ownership of the review
module.exports.isReviewAuthor = async(req,res, next)=>{
    const {id, reviewId} = req.params;
   //we need to to verify if the current user is the owner of this campground
   // the code here is the second layer authtication protection (avoid hacker paste 
   // http://localhost:3000/campgrounds/6616c0c916cc69c2c5538d0b  and then add /edit to update the campground)
   const review = await Review.findById(reviewId)
   if(!review.author.equals(req.user._id)){
        req.flash('error','You do not have the permission to do this!')
        return res.redirect(`/campgrounds/${id}`)
   }
   next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',') // 因为error 返回的detail有可能是array, 通过map()这里把他们join一起
        throw new ExpressError(msg, 400)
    } else {
        next(); // 这里允许我们没有error情况正常执行剩下的code
    }
}