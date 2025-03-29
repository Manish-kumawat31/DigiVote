const express = require('express');
const router = express.Router({mergeParams:true});
const adminController = require('../controller/admin.js');
const { route } = require('./authRoutes.js');

router.route('/profile').post(adminController.postProfile).put(adminController.putProfile);
router.route('/profile/edit').get(adminController.adminProfileEdit);
router.route('/:id/create-election').get(adminController.getCreateElection).post(adminController.postCreateElection);
router.route('/:id/:eleId/edit').get(adminController.editElection).put(adminController.putEditElection);
router.route('/:id/:eleId/delete').delete(adminController.deleteElection)
router.route('/:id/:eleId/candidate').get(adminController.getApproveCandidates)
router.route('/:adminId/approve/:id/:eleId').post(adminController.postApprove)
router.route('/:adminId/reject/:id/:eleId').post(adminController.postReject)

module.exports = router;