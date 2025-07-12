

module.exports.index = (req,res)=>{
    res.locals.ifUser=req.user;
    res.render("index")
};

module.exports.readmore = (req,res)=>{
    res.locals.ifUser=req.user;
    res.render('read_more');
}