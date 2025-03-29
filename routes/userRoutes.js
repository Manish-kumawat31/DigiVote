
const express = require("express");
const router = express.Router({mergeParams:true});
const userController = require('../controller/user');
const { get } = require("mongoose");

router.route('/:id/home').get(userController.home);
router.route('/:id/profile').get(userController.profile).post(userController.postProfile).put(userController.putProfile);
router.route('/:id/profile/edit').get(userController.profileEdit);
router.route('/:id/candidate/:eleId').post(userController.postCandidate);
router.route('/:id/vote/:eleId').get(userController.votePage);
router.route('/:id/vote/:eleId/:candidateId').post(userController.voteForCandidate)
router.route(`/result/:eleId`).get(userController.resultPage);

module.exports = router;