// campground.js
const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;  // make a shortcut

const ImageSchema = new Schema(
        {
            url: String,
            filename: String
        });
// create a virtual property for ImageSchema (to do some operation, so that we can change the size of the image when we later call   thumbnail)
ImageSchema.virtual('thumbnail').get(function(){
    return this.url.replace('/upload','/upload/w_200')  // adjust the size of thumbnail property for us to display it when needed (in upupdate page)
});

// for map
const opts = {toJSON:{virtuals: true}};

const CampGroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type:{
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            require: true
        }
    },
    
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review' // 这个file里没有 require Review model也行, DB里面有就可以.
        }
    ]
}, opts);

// this is for map 
CampGroundSchema.virtual('properties.popUpMarkUp').get(function(){
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0,30)}...</p>
    `
});

// CampGroundSchema.post('findOneAndDelete'...) 会发生在 app.js中触发了 findByIdAndDelete()方法
// Monggose底层会trigger findOneAndDelete(),我们在这里通过这种方式来进行 删掉和我们已经被删掉 associated data.
CampGroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) { // 如果确实有doc 被删除掉的情况
        await Review.deleteMany({
            //  这里idea就是 remove all review whose _id 是在刚刚被删除的doc的reviews中, 以此达到删除associated data的目的
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampGroundSchema)