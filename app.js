if(process.env.NODE_ENV!=="production"){
    require('dotenv').config();
}

const express=require('express');
const mongoose=require('mongoose');
const {campgroundSchema,reviewSchema}=require('./schemas.js');
const ejsMate=require('ejs-mate');
const session=require('express-session');
const flash=require('connect-flash');
const catchAsync=require('./utils/catchAsync');
const ExpressError=require('./utils/ExpressError')
const methodOverride=require('method-override');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const path=require('path');
const mongoSanitize = require('express-mongo-sanitize');
const helmet=require('helmet');
const User=require('./models/user');
const userRoutes=require('./routes/users');

const Campground=require('./models/campground');

const campgrounds=require('./routes/campgrounds');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const Review=require('./models/review');
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
// mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp',{
//     useNewUrlParser:true,
//     // useCreateIndex:true,
//     useUnifiedTopology:true,
//     // useFindAndModify: false
// });


// const db=mongoose.connection;
// db.on("error",console.error.bind(console,"connection error:"));
// db.once("open",()=>{
//     console.log('Database connected');
// });

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECT_URL, {
            useUnifiedTopology: true,
            useNewUrlParser: true, 
            // useNewUrlParser: true,
            // useCreateIndex: true,
            // useUnifiedTopology: true,
            // useFindAndModify: false
        });

        console.log('Database connected');
    } catch (error) {
        console.error('Connection error:', error);
       
    }
}

connectToDatabase();
const app=express();
app.engine('ejs',ejsMate);

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))

app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(
    mongoSanitize({
      replaceWith: '_',
    }),
  );



const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    name: 'session',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
// app.use(helmet());

// const scriptSrcUrls = [
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://api.mapbox.com/",
//     "https://kit.fontawesome.com/",
//     "https://cdnjs.cloudflare.com/",
//     "https://cdn.jsdelivr.net",
// ];
// const styleSrcUrls = [
//     "https://kit-free.fontawesome.com/",
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.mapbox.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://fonts.googleapis.com/",
//     "https://use.fontawesome.com/",
// ];
// const connectSrcUrls = [
//     "https://api.mapbox.com/",
//     "https://a.tiles.mapbox.com/",
//     "https://b.tiles.mapbox.com/",
//     "https://events.mapbox.com/",
// ];
// const fontSrcUrls = [];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", "blob:"],
//             objectSrc: [],
//             imgSrc: [
//                 "'self'",
//                 "blob:",
//                 "data:",
//                 "https://res.cloudinary.com/Rituporna Das/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
//                 "https://images.unsplash.com/",
//             ],
//             fontSrc: ["'self'", ...fontSrcUrls],
//         },
//     })
// );

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


const validateCampground=(req,res,next)=>{
   
    const {error}=campgroundSchema.validate(req.body);
    if(error){
        
        const msg=error.details.map(el=> el.message).join('.')
        throw new ExpressError(msg,400)
    }else{
        next();
    }
   
}

const validateReview=(req,res,next)=>{
    const{error}=reviewSchema.validate(req.body);
    console.log(error)
    if(error){
        const msg=error.details.map(el=> el.message).join('.')
        throw new ExpressError(msg,400)
    }else{
        next();
    }
}

app.use('/',userRoutes);
app.use('/campgrounds',campgroundRoutes)
app.use('/campgrounds/:id/reviews',reviewRoutes);
app.get('/',(req,res)=>{
    res.render('home');
})


// app.post('/campgrounds/:id/reviews',validateReview,catchAsync(async(req,res)=>{
//    const campground=await Campground.findById(req.params.id);
//    const review=new Review(req.body.review);
//    campground.reviews.push(review);
//    await review.save();
//    await campground.save();
//    res.redirect(`/campgrounds/${campground._id}`);
// }))

// app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
//     const { id, reviewId } = req.params;
//     await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
//     await Review.findByIdAndDelete(reviewId);
//     res.redirect(`/campgrounds/${id}`);
// }))

// app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
//     const { id, reviewId } = req.params;
//     await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
//     await Review.findByIdAndDelete(reviewId);
//     res.redirect(`/campgrounds/${id}`);
// }))

app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not found',404))
})

app.use((err,req,res,next)=>{
    const { statusCode=500}=err;
    if(!err.message) err.message='something went wrong!'
    res.status(statusCode).render('error',{err})
})
app.listen(3000,()=>{
    console.log('Serving on port 3000');
})