const express = require('express')
const router = express.Router();
const passport = require('passport')
const User = require('../models/user')
const catchAsync = require('../utils/catchAsync')
const { storeReturnTo } = require('../middleware'); // stored url before user is being sent to login
const users = require('../controllers/users');

//  simpler way of handling routes: put the same route but different verbs together
// 参考, 但是我不选择这个
// router.route('/register')
//     .get( users.renderRegister )
//     .post( catchAsync(users.register))

// router.route('/login')
//     .get( users.renderLoggin)
//     .post(storeReturnTo,
//     passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
//    users.login
//    )

router.get('/register', users.renderRegister )
router.post('/register', catchAsync(users.register));

router.get('/login', users.renderLoggin)

// passport allow us to do some authentication by pass argument! if not correct password for example,
// it will redirect the user to /login. if valid, it will go into the code below
// 'local' can be different types: google, facebook....
// note: call storeReturnTo before passport.authenticate... to store the previous url!
router.post('/login',
    storeReturnTo,
    passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
   users.login
   )


router.get('/logout', users.logout)


module.exports = router;
