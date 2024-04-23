
// the reason of using controller folder
//  Model-View-Controller (MVC) is one of the most frequently used industry-standard web development frameworks to create scalable and extensible projects. 
//framework is an architectural/design pattern that separates an application into three main logical components Model, View, and Controller. Each architectural 
// component is built to handle specific development aspects of an application. It isolates the business logic and presentation layer from each other. 
// The main goal of this design pattern was to solve the problem of users controlling a large and complex data set by splitting a large application into specific sections that all have their own purpose.
// exports some feature functions  here

const Campground = require('../models/campground');
const {cloudinary} = require('../cloudinary')

//  for map purpose
const mbxGeoCoding = require("@mapbox/mapbox-sdk/services/geocoding")
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeoCoding({ accessToken: mapBoxToken })


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', { campgrounds })
};


module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()

    // 测试一个, 在 new.ejs 已经通过bootstrap handle invalid input了(这里不处理也可以,只是show如何一下处理特定的error)
    // if(!req.body.campground) throw new ExpressError('Invalid campground',400); 
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    // after multer upload the images to the cloudinary, it can give us  req.files, and then we can do relative operations on them.
    // need to  parse the req.files to store the info to campground.images(upload image的地方)
    campground.images= req.files.map(f=> ({url: f.path, filename:f.filename})) // map the values in req.files to imges attributs in the camground model

    // Before save, we add the current user to this associred campground
    campground.author = req.user._id;
    await campground.save();
    console.log(campground)

    // note: req.flash的middleware 帮助我们只定义一次在 app.js
    req.flash('success', 'successfully made a new campground!');
    // redirect argumen要 / 开头, render不要
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res, next) => {
    const campground = await Campground.findById(req.params.id).populate({
        path:'reviews', // here we populate the review
        // we also need to populate the author of the review
        populate:{  
            path: 'author'
        }
    }).populate('author');

    // if messed up with getting campground: like change the url, we can use flash to alert an error
    // exmple: delete一个camground之后, 把被delete的id又paste到 URL尝试去access that campground
    if (!campground) {
        req.flash('error', 'Error! Can not find the campground!')
        return res.redirect('/campgrounds') // use redirect and return it, otherwise it is goind to render
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    if (!campground) {
        req.flash('error', 'Error! Can not find the campground!')
        return res.redirect('/campgrounds') // use redirect and return it, otherwise it is goind to render
    }
    res.render('campgrounds/edit', { campground })
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
   // {...eq.body.campground} 代表了所有的提交的更新data  
   // then if it verifies the user, run this
   const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground })
   const imgs = req.files.map(f=> ({url: f.path, filename:f.filename})) // since req.files.map(f=> ({url: f.path, filename:f.filename})) give us array, we cannot push an array into the array (images) in our Schema, we assign it to a variable
    camp.images.push(...imgs) // ...imgs:  spread the array into objects, so that it is not passed as array
    await camp.save();
    console.log('deleteImages:', req.body.deleteImages);
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename); // first delete imgaes on the cloudinary
        }
        await camp.updateOne({ $pull: {images: {filename: {$in: req.body.deleteImages}}}})
        console.log(camp)
    }
    req.flash('success', 'Successfully updated!!')
    res.redirect(`/campgrounds/${camp._id}`)
}



module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    // 这里会和campgrpund.js model file配合来进行删除和这个刚刚被删除的associated的data
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted a campground!')

    //  记住: redirect 的argument 要首先'/...'  符号别忽略
    res.redirect('/campgrounds')
}