require("dotenv").config()
const express = require("express")
const ejs = require("ejs")
const parser = require("body-parser")
const mongoose = require("mongoose")    
const session = require("express-session") //For creating the session
const passport = require("passport") //For authentication purpose
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findorcreate = require("mongoose-findorcreate");  //For implementing findorcreate method
const openssl = require('openssl-nodejs')


openssl('openssl req -config csr.cnf -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout key.key -out certificate.crt')

openssl(['req', '-config', 'csr.conf', '-out', 'CSR.csr', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'privateKey.key'], function (err, buffer) {
    console.log(err.toString(), buffer.toString());
});
    

app = express()
app.use(parser.urlencoded({extended: true}))
app.set("view engine" , "ejs")
app.use(express.static("public"))
app.use(session({
    secret:"THisIsNotGood",
    resave: false,
    saveUninitialized: false

})); 

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB");

const user_schema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})
user_schema.plugin(passportLocalMongoose);
user_schema.plugin(findorcreate);



const user_model = new mongoose.model("User" , user_schema)

passport.use(user_model.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    user_model.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETE,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    user_model.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/" , function (req , res) { 
    res.render("home") 
 })



app.get("/auth/google", passport.authenticate("google" , {scope: ["profile"]}))

app.get("/auth/google/secrets"  ,  
    passport.authenticate("google" , {failureRedirect: "/login"}),
    function(req , res) { 
        res.redirect("/secrets")            
     }
)
 



 app.get("/login" , function (req , res) { 
    res.render("login")
 })

 app.get("/register" , function (req , res) { 
    res.render("register")
 })


 app.get("/secrets" , function(req , res){
    if(req.isAuthenticated()){  //It will check if user is logged in or not
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
 })

 app.post("/register" , function (req  , res) { 
    let newEmail = req.body.username;
    let newPassword = req.body.password;
    user_model.register({username: newEmail} , newPassword , function(err , user){
        if(err)
        {
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req , res, function () { //Authentication means user is now logged in in website it will store the information in the current session of the user
                res.redirect("secrets")
             })
        }
    })
    

    
  })

app.post("/login" , function (req , res) { 
    let newEmail = req.body.username;
    let newPassword = req.body.password;
    const user = new user_model({
        username: newEmail,
        password: newPassword
    })

    req.login(user, function (err) { 
        if(err)
        {
            console.log(err);
        }else{
            passport.authenticate("local")(req , res , function () { 
                res.redirect("/secrets")
             })
        }
     })

 })


app.get("/logout" , function (req , res) { 
    req.logout(function (err) { if(err){
        console.log(err);
    } }); //Logout and add the information in the session
    res.redirect("/");
 })

app.listen(3000 , function () { 
    console.log("Server is running");
 })
//In the above code we are using session cookies so it will store the cookies and session  of the current use
// so whenever user is logged in it will stay logged in the system until browser closes or cookies got deleted

// Once user is logged out then user will not able to access the secret




