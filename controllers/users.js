const User = require('../models/user')


module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    // await User.register(user,'chicken')   // after calling the plugin() in the model file, it gives us register method
    // through which we can pass in an object and password, it will help us check the uniqueness of username and then
    // do the hash and add salt value to that hash value.
    try { // if error occurs, we just send a flash message and redirect to /register page 
        const { email, username, password } = req.body;
        const user = new User({ email, username })  // we can pass (email, username), even though the userSchema only has email attribute, this is because of userSchema.plugin(). details see userSchema
        const registeredUser = await User.register(user, password) // note: need await
        // req.login is a helper method of passport, used after register and help the user log in automatically
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash('success', "Welcome to Yelp Camp!!")
            res.redirect('/campgrounds')
        })

    } catch (e) {
        req.flash('error', e.message)
        res.redirect('/register')
    }
}

module.exports.renderLoggin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome Back!')
    const redirectUrl = res.locals.returnTo || '/campgrounds';  // in case returnTo cannot be fetched and cause error

    res.redirect(redirectUrl)
}



module.exports.logout= (req, res) => {
    req.logout(function (err) { // logout needs to have this function definition
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
}