//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
// const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin_oooppp:yourpass123@cluster0.hoqad94.mongodb.net/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETE,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOne( {googleId : profile.id}, function( err, foundUser ){
        if( !err ){                                                          //Check for any errors
            if( foundUser ){                                          // Check for if we found any users
                return cb( null, foundUser );                  //Will return the foundUser
            }else {                                                        //Create a new User
                const newUser = new User({
                    googleId : profile.id
                });
                newUser.save( function( err ){
                    if(!err){
                        return cb(null, newUser);                //return newUser
                    }
                });
            }
        }else{
            console.log( err );
        }
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets",
    enableProof: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne( {facebookId : profile.id}, function( err, foundUser ){
        if( !err ){                                                          //Check for any errors
            if( foundUser ){                                          // Check for if we found any users
                return cb( null, foundUser );                  //Will return the foundUser
            }else {                                                        //Create a new User
                const newUser = new User({
                    facebookId : profile.id
                });
                newUser.save( function( err ){
                    if(!err){
                        return cb(null, newUser);                //return newUser
                    }
                });
            }
        }else{
            res.send("Please Register First " +"<h3><a href=/register> Register </a></h3>")
            
            console.log( err );
        }
    });
  }
));




app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });



app.get('/auth/facebook',
    passport.authenticate('facebook' ));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");

});


app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit" , function (req , res) { 
    if(req.isAuthenticated())
    {
        res.render("submit")
    }else{
        res.redirect("/login")
    }
 })

app.post("/submit" , function (req , res) { 
    let secret = req.body.secret;
    User.findById(req.user.id ,function (err , foundUser) { 
        if(err)
        {
            console.log(err);
        }else{
            foundUser.secret = secret;
            foundUser.save(function () { 
                res.redirect("/secrets")
             })
        }
     })

 })



app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res){
   

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
    
  req.login(user, function(err){
    if (err) {
      console.log("YOu are not registered first please register than login");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }       
  });
  res.send("Please Register First " +"<h3><a href=/register> Register </a></h3>")


});







app.listen(3000 || process.env.PORT, function() {
  console.log("Server started on port 3000.");
});