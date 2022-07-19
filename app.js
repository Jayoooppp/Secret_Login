require("dotenv").config();
const express = require("express")
const ejs = require("ejs")
const parser = require("body-parser")
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

mongoose.connect("mongodb://localhost:27017/userDB");

const user_schema = new mongoose.Schema({
    email: String,
    password: String
})

const secret = process.env.SECRET;
user_schema.plugin(encrypt , {secret: secret , encryptedFields: ["password"]});

const user_model = new mongoose.model("User" , user_schema)







app = express()
app.use(parser.urlencoded({extended: true}))
app.set("view engine" , "ejs")
app.use(express.static("public"))


app.get("/" , function (req , res) { 
    res.render("home")
 })

 app.get("/login" , function (req , res) { 
    res.render("login")
 })

 app.get("/register" , function (req , res) { 
    res.render("register")
 })

 app.post("/register" , function (req  , res) { 
    let newEmail = req.body.username;
    let newPassword = req.body.password;
    const newUser = new user_model({
        email: newEmail,
        password: newPassword
    })

    newUser.save(function (err) { 
        if(err)
        {
            console.log(err);
        }else{
            res.render("secrets");
        }
     });
  })

app.post("/login" , function (req , res) { 
    let newEmail = req.body.username;
    let newPassword = req.body.password;
    user_model.findOne({email:newEmail} , function (err , result){ 
        if(err)
        {
            console.log(err);        
        }else{
            if(result)
            {
                if(result.password === newPassword)
                {
                    res.render("secrets"); 
                }else{
                    
                    console.log('Please Enter Valid password')

                }
            }else{
                
                    console.log('You are not registered Please login!')
                
            }
        }
    })
     

 })





app.listen(3000 , function () { 
    console.log("Server is running");
 })
