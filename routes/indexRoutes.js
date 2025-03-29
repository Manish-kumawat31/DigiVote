const express = require("express")
const router = express.Router({mergeParams:true});
const indexController = require("../controller/index.js")

router.route("/").get(indexController.index);
router.route('/read-more').get(indexController.readmore);
module.exports = router;
