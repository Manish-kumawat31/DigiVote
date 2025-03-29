const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const connectDB = require('./config/db');
const PORT = process.env.PORT;
const path = require("path")
const engine = require('ejs-mate');
const methodOverride = require('method-override');
const LocalStrategy = require("passport-local");
const User = require("./models/User.js")
const mongoose = require('mongoose');
const { send } = require('process');
const { constants } = require('buffer');
const errorHandler = require("./middlewares/errorHandler");
const Election = require('./models/election.js');
// Import Routes
const authRoutes = require("./routes/authRoutes");
const indexRoutes = require("./routes/indexRoutes.js");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

main().then((res)=>{
    console.log("Connection successful With DB");
    
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.DB_URI);
}

app.engine('ejs', engine);
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Express Session
app.use(session({
    secret: process.env.SESSION_SECRET, // Change this to a strong secret
    resave: false,
    saveUninitialized: false
}));

app.use(flash());

// Middleware to pass flash messages to views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({ usernameField: "email" }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Routes
app.use("/index" , indexRoutes);
app.use("/auth", authRoutes);
app.use("/login/admin", adminRoutes);
app.use("/login", userRoutes);


// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Error Handling Middleware
app.use(errorHandler);


setInterval(async () => {
    const elections = await Election.find();
    
    for (const election of elections) {
        const newStatus = election.updateStatus();
        
        if (election.status !== newStatus) {
            election.status = newStatus;
            if (newStatus === "Completed") {
                election.resultDeclared = true;
            }
            await election.save();
        }
    }

    console.log("Election statuses updated.");
}, 1 * 60 * 1000); // Runs every 1 minutes


app.listen(PORT, "0.0.0.0" , () => console.log(`Server running on http://localhost:${PORT}`));
