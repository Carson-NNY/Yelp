// app.js
// if we are in the development, add the variables we defined in .env file
// and add them into the process.env in the node app, so we can access them in our 
//all files in Yelpcamp directory.  (.env 为了保护credentials, it is normally invisible to the user)
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

//  test2


const express = require('express')
const path = require('path')
const session = require('express-session')
const MongoDBStore = require('connect-mongo');
const flash = require('connect-flash')
const mongoose = require('mongoose')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const userRoutes = require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds') // require the router
const reviewRoutes = require('./routes/reviews')
const app = express();
const passport = require('passport') // authentication! 
const LocalStrategy = require('passport-local')
const helmet = require('helmet')  // Helmet helps secure Express apps by setting HTTP response headers. 提供了11个middleware for security features exmaple: Content-Security-Policy: A powerful allow-list of what can happen on your page which mitigates many attacks
const User = require('./models/user')
// ejs.mate (better than partials: better boilerplate tool) 先install:  npm i ejs-mate
// ejs-mate allows us to use the layout function to use boilerplate file(相当于高级的partials)
const ejsMate = require('ejs-mate') //ejs-mate是 one of many engines which are
// used to parse, run...ejs.  后面还需要 app.engine('ejs',ejsMate). so we need to tell the machine to use this engine
// 我们这里使用ejs-mate 是一种更好的partials, (reuse boilerplates)
const methodOverride = require('method-override')
const mongoSanitize = require('express-mongo-sanitize')

//  only for deployment
const dbUrl = process.env.DB_URL

// const dbUrl = 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl)

// just copy connection 连接成功与失败的处理
const db = mongoose.connection; // make db shortcut
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true })) // needed to allow us the get access to the body of request
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public'))) //  serve the static files(images, stylesheets, validateforms的代码...)
app.use(mongoSanitize()) // prevent Mongo injection: not allow any request contain $ or .  (hack: http://localhost:3000/campgrounds/?$gt=wdwdw)


//  let the session not store in memory but on the Mongoose. 
const store = MongoDBStore.create({
    mongoUrl: dbUrl,  
    touchAfter: 24 * 60 * 60,  // tell Mongo not to repetitively resave some data that has not been changed
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});


store.on("error", function(e){
    console.log("SESSION STORE ERROR",e)
})


const sessionConfig = {
    store,
    secret: 'shouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        name: 'session',
        httpOnly: true, // security reason
        // secure: true, // only use this for deploy (for using https)

        // fancy set for cookie! set the expiration date (a week from now)
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // milisecond * seconds * minutes * hours * 7 days
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}
app.use(session(sessionConfig))
app.use(flash())
app.use(helmet()) // activate helmet

// coppied setup for helmet: restrict locations from whcih we can fetch resources to enhance security
// (reduce the risk of others inserting their scripts) if more websites are needed in the future, we can add them here. 
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://code.jquery.com",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",

];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dplliarci/", //need to match my cloudinary name 
                "https://images.unsplash.com/",
                "https://media.timeout.com",
                "https://assets.simpleviewinc.com", //  need to put the websites from whcih I fetch the image here. otherwise it won't pass the security check
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);



// need set up the middleware for authentication
app.use(passport.initialize());
app.use(passport.session());   // to activate the session for passport
passport.use(new LocalStrategy(User.authenticate()))  // User.authenticate() is defined by the system after call in user.js file where called userSchema.plugin(passportLocalMongoose);
passport.serializeUser(User.serializeUser()); // tell the program how do we store the user in the session
passport.deserializeUser(User.deserializeUser());

//note: put flash middleware before calling the routers. (这里we put flash into res.locals)
// 这样如果req.flash('success')被激活, 页面都会被默认passed in success
app.use((req, res, next) => {
    //In Express.js, res.locals is an object that provides a way to pass data through
    // the application during the request-response cycle. It allows you
    //  to store variables that can be accessed by your templates and other middleware functions.

    // help us for the navbar to see if there is current user signed in, so that we show corresponding options for(register, login, logout)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next();
})

app.use('/', userRoutes)
app.use('/campgrounds', campgroundRoutes) // router set up. for this /campgrounds/... route, 必须放在这里不然报错? 
app.use('/campgrounds/:id/reviews', reviewRoutes)  // note: 对于router的使用, 这里的id需要在express router里面设置mergeParams:true


app.get('/', (req, res) => {
    res.render('home')
})

// this only runs when anything above is not matched and not respond. 
// app.all() means: for every single request.   '*' means for evert path
app.all('*', (req, res, next) => {
    // 这里call next(...) means pass this error And proceed to the rest of the code(下面会进行处理)
    next(new ExpressError('page not found', 404))
})

// 针对于上面各种的error hanle后这里进行处理(这里的新增的err argument)
// 就是上面 next(new ExpressError(...)) throw出来的
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;  // 这里获得err中的信息
    if (!err.message) err.message = 'Oh no, something went wrong!'
    // 我们建一个处理error的ejs file 去beautifu how the error message looks
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log('serving on port: 3000')
})