const User = require("../models/User");

// login
module.exports.getLogin = (req, res) => {
    res.render("login");
}
module.exports.postLogin = (req, res) => {
    res.locals.ifUser = req.user;
    res.render("index.ejs");
}

// SignUp

module.exports.getSignup = (req, res) => {
    res.render("signUp");
}
module.exports.postSignup = async (req, res) => {
    try {
        const { name, email, college, role, password } = req.body;
        const user = new User({ name, email, college, role });
        let registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => {
            if (err) return res.send("Error occurred");
            req.flash("success" , 'Signup successfully!');
            return res.redirect("/index");
        });
    } catch (error) {
        console.log(error);
        return res.redirect("/auth/signup");
    }
}

module.exports.logout = (req, res) => {
    req.logout((err) => {
        if (err){ 
        req.flash('error' , err);
        return res.redirect("/index");
        }
        req.flash('success' , 'Logout successfully!')
        res.redirect("/index");
    });
};
