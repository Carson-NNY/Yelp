// unlike examples in my notes, we use passport to do the authenticaiton
// need to install :  npm i passport passport-local passport-local-mongoose  

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')


// later if we are to create a new user, we can simple (原因可以pass username which is not defined here see explanation below for userSchema.plugin):  
//   const user = new User({ email,username})
//   const registeredUser = await User.register(user, password) 

const userSchema = new Schema({
    email:{
        type: String,
        required: true,
        unique: true
    }
})

// critical method!: here we call "plugin" which will add in userSchema the fields for  username and password
// the systems makes sure the username is unique.  And it also gives us some methods to use.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);