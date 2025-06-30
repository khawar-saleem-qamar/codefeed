const express = require('express');
const router = express.Router();
const { createJob, editJob, 
    // submitJobContent, updateJobStatus, 
    saveAssignmentProgress, submitAssignment, getUserJobs, getUserJobById, reviseAssignment, completeAssignment, getAllJobs, getJobByUserId, getAllBaseJobs, getBaseJobById } = require("../controllers/jobController");
const requireAuth = require("../middleware/requireAuth");
const { protectedRoutes, allowedTo } = require('../controllers/authController');

router.use(requireAuth);

router.post("/createJob", protectedRoutes, createJob);
router.patch("/editJob", editJob);
// router.patch("/submitJobContent", submitJobContent);
// router.patch("/updateJobStatus", updateJobStatus);
router.patch("/submitAssignment", protectedRoutes, submitAssignment);
router.patch("/saveAssignmentProgress", protectedRoutes, saveAssignmentProgress);
router.patch("/reviseAssignment", reviseAssignment);
router.patch("/completeAssignment", completeAssignment);
router.get("/getUserJobs", protectedRoutes, getUserJobs);
router.get("/getAllJobs", protectedRoutes, allowedTo('admin', "main-admin"), getAllJobs);
router.get("/getUserJobById/:jobId", protectedRoutes, getUserJobById)
router.get("/getJobByUserId/:jobId/:userId", getJobByUserId)
router.get("/getAllBaseJobs", protectedRoutes, allowedTo('admin', "main-admin"), getAllBaseJobs)
router.get("/getBaseJobById", protectedRoutes, allowedTo('admin', "main-admin"), getBaseJobById)

module.exports = router;