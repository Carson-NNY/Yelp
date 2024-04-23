//  campgrounds.js
const express = require('express')
const router = express.Router();
const campgrounds = require('../controllers/campgrounds') // in this way, variable campgrounds  has multiple exported methods
const catchAsync = require('../utils/catchAsync')
const ExpressError = require('../utils/ExpressError')
const Campground = require('../models/campground');
const {isLoggedIn, validateCampground, isAuthor} = require('../middleware')

// need to have multer parse the form information for cloudinary (for the purpose if uplodaing image)
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });


//  simpler way of handling routes: put the same route but different verbs together
// 参考, 但是我不选择这个
// router.route('/')
//    .get( catchAsync(campgrounds.index))
//    .post( isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground))

// router.route('/:id')
//    .get( catchAsync(campgrounds.showCampground))
//    .put( isLoggedIn,isAuthor, validateCampground, catchAsync(campgrounds.updateCampground))
//    .delete(isLoggedIn,isAuthor, catchAsync(campgrounds.deleteCampground))

// async is needed when we need to call Campground.find({}) 等 which take time!
// 这里we put the function that handles async error to catchAsync.js 里
router.get('/', catchAsync(campgrounds.index))

   // put the authentication code inanother file (middleware.js), for better use
   // then pass it before (req,res).
router.get('/new',isLoggedIn, campgrounds.renderNewForm)

// put isLoggedIn before validateCampground, because middleware is executed in order
// we can just put '/' here because  in the app.js we already used /campgrounds for campgroundRoutes
// router.post('/', isLoggedIn, validateCampground, catchAsync(campgrounds.createCampground))

// upload.single/array(要match name in submitted form)  help us store the files on req.file/files and upload it to Cloudinary
// 暂时: upload.array('CampgroundImage') 要放到 validateCampground 之前
router.post('/', isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

// router.post('/', upload.array('CampgroundImage'), (req,res)=>{
//    console.log(req.body,req.files)
//    res.send('worked!')
// })

router.get('/:id', catchAsync(campgrounds.showCampground))

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))

router.put('/:id', isLoggedIn,isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))

router.delete('/:id',isLoggedIn,isAuthor, catchAsync(campgrounds.deleteCampground))


module.exports = router;


