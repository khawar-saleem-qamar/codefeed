const Job = require("../models/jobModel");
const Assignment = require("../models/assignmentModel");
const User = require("../models/userModel");
const { sendRes } = require("../helpers/otherHelpers");
const Wallet = require("../models/walletModel");
const { catchAsyncError } = require("../utils/catchAsyncError");
const { ApiFeatures } = require("../utils/ApiFeatures");

const createJob = async (req, res) => {
  try {
    const { title, description, amount, deadlineTime, assignedTo, specificAssignedUsers, type } = req.body;
    
    if (!title || !description || !amount || !deadlineTime || !assignedTo) {
      return sendRes(res, 400, false, "Missing required fields");
    }

    if (assignedTo === "specific" && (!specificAssignedUsers || !Array.isArray(specificAssignedUsers))) {
        try{
            specificAssignedUsers = JSON.parse(specificAssignedUsers);
        }catch(e){
            return sendRes(res, 400, false, "specificAssignedUsers must be a valid array when assignedTo is specific");
        }
    }

    const job = await Job.create({
      title,
      description,
      amount,
      deadlineTime: new Date(deadlineTime),
      assignTime: new Date(),
      assignedTo,
      specificAssignedUsers: assignedTo === "specific" ? specificAssignedUsers : [],
      type,
      createdBy: req.user._id // Assuming requireAuth middleware adds user to req
    });

    // Create assignments
    let usersToAssign = [];
    if (assignedTo === "all") {
      usersToAssign = await User.find({role: "employee"}).select('_id');
    } else {
      usersToAssign = specificAssignedUsers.map(id => ({ _id: id }));
    }

    // Create assignments for each user if they don't exist
    const assignments = await Promise.all(
      usersToAssign.map(async (user) => {
        var existingAssignment = await Assignment.findOne({
          userId: user._id,
          jobId: job._id
        });

        if (!existingAssignment) {
          existingAssignment = await Assignment.create({
            userId: user._id,
            jobId: job._id,
            status: "assigned",
            assignedAt: new Date()
          });
        }
        return existingAssignment;
      })
    );

    sendRes(res, 200, true, { job, assignments });
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const editJob = async (req, res) => {
  try {
    const { jobId, title, description, amount, deadlineTime, assignedTo, specificAssignedUsers } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return sendRes(res, 400, false, "Job not found");
    }

    const updateData = {
      title: title || job.title,
      description: description || job.description,
      amount: amount || job.amount,
      deadlineTime: deadlineTime ? new Date(deadlineTime) : job.deadlineTime,
      assignedTo: assignedTo || job.assignedTo
    };

    if (assignedTo === "specific") {
      updateData.specificAssignedUsers = specificAssignedUsers || job.specificAssignedUsers;
      
      // Update assignments for specific users
      const existingAssignments = await Assignment.find({ jobId });
      const currentUserIds = existingAssignments.map(a => a.userId.toString());
      const newUserIds = specificAssignedUsers || [];

      // Remove assignments for users no longer in the list
      await Assignment.deleteMany({
        jobId,
        userId: { $nin: newUserIds }
      });

      // Add new assignments for new users
      const usersToAdd = newUserIds.filter(id => !currentUserIds.includes(id));
      await Promise.all(
        usersToAdd.map(async userId =>
          await Assignment.create({
            userId,
            jobId,
            status: "assigned",
            assignedAt: new Date()
          })
        )
      );
    } else if (assignedTo === "all") {
      updateData.specificAssignedUsers = [];
      // Assign to all users
      const allUsers = await User.find().select('_id');
      await Promise.all(
        allUsers.map(async user => {
          const existingAssignment = await Assignment.findOne({
            userId: user._id,
            jobId
          });
          if (!existingAssignment) {
            return await Assignment.create({
              userId: user._id,
              jobId,
              status: "assigned"
            });
          }
        })
      );
    }

    await job.updateOne(updateData);
    const updatedJob = await Job.findById(jobId);
    sendRes(res, 200, true, updatedJob);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

// const submitJobContent = async (req, res) => {
//   try {
//     const { jobId, userId, content } = req.body;

//     const assignment = await Assignment.findOne({ jobId, userId });
//     if (!assignment) {
//       return sendRes(res, 400, false, "Assignment not found");
//     }

//     await assignment.updateOne({
//       content,
//       status: "submitted",
//       submittedAt: new Date()
//     });

//     const updatedAssignment = await Assignment.findOne({ jobId, userId });
//     sendRes(res, 200, true, updatedAssignment);
//   } catch (error) {
//     sendRes(res, 400, false, error.message);
//   }
// };


// const updateJobStatus = async (req, res) => {
//   try {
//     const { jobId, userId, status } = req.body;
    
//     if (!["assigned", "submitted", "underreview", "completed"].includes(status)) {
//       return sendRes(res, 400, false, "Invalid status");
//     }

//     const assignment = await Assignment.findOne({ jobId, userId });
//     if (!assignment) {
//       return sendRes(res, 400, false, "Assignment not found");
//     }

//     await assignment.updateOne({ status });
//     const updatedAssignment = await Assignment.findOne({ jobId, userId });
//     sendRes(res, 200, true, updatedAssignment);
//   } catch (error) {
//     sendRes(res, 400, false, error.message);
//   }
// };

const getUserJobs = async (req, res) => {
  try {
    const userId = req.user._id.toString()
    console.log(":userid: ", userId)
    
    const assignments = await Assignment.find({ userId })
      .populate({
        path: 'jobId',
        select: 'title description amount deadlineTime assignTime assignedTo type'
      });

    const userJobs = assignments.map(assignment => ({
      ...assignment.jobId.toObject(),
        status: assignment.status,
        content: assignment.content,
        submittedAt: assignment.submittedAt,
        revisionDescription: assignment.revisionDescription,
        revisedAt: assignment.revisedAt,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt
    }));

    sendRes(res, 200, true, userJobs);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const getAllJobs = async (req, res) => {
  try {    
    const assignments = await Assignment.find({})
      .populate({
        path: 'jobId',
        select: 'title description amount deadlineTime assignTime assignedTo type'
      })
      .populate({
        path: 'userId',
        select: 'username profilePic phone'
      });

    const userJobs = assignments.map(assignment => ({
      ...assignment.jobId.toObject(),
        status: assignment.status,
        content: assignment.content,
        submittedAt: assignment.submittedAt,
        revisionDescription: assignment.revisionDescription,
        revisedAt: assignment.revisedAt,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        user: assignment.userId.toObject()
    }));

    sendRes(res, 200, true, userJobs);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const getAllBaseJobs = catchAsyncError(async (req, res, next) => {
    let apiFeature = new ApiFeatures(Job.find(), req.query)
    .filteration()
    .search()
    
    const count = await apiFeature.getTotalCount();
        
    apiFeature.pagination().sort()
    const PAGE_NUMBER = apiFeature.queryString.page * 1 || 1;
    const result = await apiFeature.mongooseQuery;
  
  
    res.status(201).json({ success: true, count, page: PAGE_NUMBER, result });
})

const getUserJobById = async (req, res) => {
  try {
    const {jobId} = req.params
    
    const assignment = await Assignment.findOne({jobId, userId: req.user._id.toString()})
      .populate({
        path: 'jobId',
        select: 'title description amount deadlineTime assignTime assignedTo type'
      });

    const userJob = {
      ...assignment.jobId.toObject(),
        status: assignment.status,
        content: assignment.content,
        submittedAt: assignment.submittedAt,
        revisionDescription: assignment.revisionDescription,
        revisedAt: assignment.revisedAt,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt
    }

    sendRes(res, 200, true, userJob);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const getJobByUserId = async (req, res) => {
  try {
    const {jobId, userId} = req.params
    
    const assignment = await Assignment.findOne({jobId, userId})
      .populate({
        path: 'jobId',
        select: 'title description amount deadlineTime assignTime assignedTo type'
      });

    const userJob = {
      ...assignment.jobId.toObject(),
        status: assignment.status,
        content: assignment.content,
        submittedAt: assignment.submittedAt,
        revisionDescription: assignment.revisionDescription,
        revisedAt: assignment.revisedAt,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt
    }

    sendRes(res, 200, true, userJob);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const getBaseJobById = async (req, res) => {
  try {
    const {jobId} = req.params
    
    const job = await Job.findOne({jobId})

    sendRes(res, 200, true, job);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const submitAssignment = async (req, res) => {
  try {
    const { jobId, content } = req.body;
    const userId = req.user._id;

    const assignment = await Assignment.findOne({ jobId, userId });
    if (!assignment) {
      return sendRes(res, 400, false, "Assignment not found");
    }

    await assignment.updateOne({
      content,
      status: "underreview",
      submittedAt: new Date()
    });

    const updatedAssignment = await Assignment.findOne({ jobId, userId });
    sendRes(res, 200, true, updatedAssignment);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const reviseAssignment = async (req, res) => {
  try {
    const { jobId, revisionDescription, userId } = req.body;

    const assignment = await Assignment.findOne({ jobId, userId });
    if (!assignment) {
      return sendRes(res, 400, false, "Assignment not found");
    }

    if (assignment.status != "underreview") {
      return sendRes(res, 400, false, "Can not give revision for this assignment status");
    }

    await assignment.updateOne({
      revisionDescription,
      status: "revised",
      revisedAt: new Date()
    });

    const updatedAssignment = await Assignment.findOne({ jobId, userId });
    sendRes(res, 200, true, updatedAssignment);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const completeAssignment = async (req, res) => {
  try {
    const { jobId, userId } = req.body;

    const assignment = await Assignment.findOne({ jobId, userId });
    if (!assignment) {
      return sendRes(res, 400, false, "Assignment not found");
    }

    const job = await Job.findById(assignment.jobId);
    if (!job) {
      return sendRes(res, 400, false, "Job not found");
    }

    if (assignment.status != "underreview") {
      return sendRes(res, 400, false, "Can not mark complete for this assignment status");
    }

    await assignment.updateOne({
      status: "completed",
      completedAt: new Date()
    });

    var amount = job.amount || 0;
    var userWallet = await Wallet.findOne({userid: userId})
    await userWallet.updateOne({
      $inc: {
          balance: amount
      },
      $push: {
          history: {
              transactionType: "assignment",
              amount: amount,
              modelId: assignment._id,
              effect: "debit"
          }
      }
    })
    sendRes(res, 200, true, "Assignment completed");
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

const saveAssignmentProgress = async (req, res) => {
  try {
    const { jobId, content } = req.body;
    const userId = req.user._id;
    console.log("jobId: ", jobId, " userId: ", userId, " content: ", content)

    const assignment = await Assignment.findOne({ jobId, userId });
    if (!assignment) {
      return sendRes(res, 400, false, "Assignment not found");
    }

    await assignment.updateOne({
      content,
      status: "saved",
      submittedAt: new Date()
    });

    const updatedAssignment = await Assignment.findOne({ jobId, userId });
    sendRes(res, 200, true, updatedAssignment);
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
};

module.exports = {
  createJob,
  editJob,
  // submitJobContent,
  // updateJobStatus,
  saveAssignmentProgress, 
  submitAssignment,
  getUserJobs,
  getUserJobById,
  reviseAssignment,
  completeAssignment,
  getAllJobs,
  getJobByUserId,
  getAllBaseJobs,
  getBaseJobById
};