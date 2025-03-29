const express = require("express");
const router = express.Router({mergeParams:true});
const passport = require("passport");
const AuthController = require('../controller/Auth');
// Signup
router.route("/signup").get(AuthController.getSignup)
.post(AuthController.postSignup);

// Login
router.route("/login").get(AuthController.getLogin)
.post(passport.authenticate("local", { failureRedirect: "/auth/login" }),AuthController.postLogin);

// Logout
router.route("/logout").get(AuthController.logout);

module.exports = router;

