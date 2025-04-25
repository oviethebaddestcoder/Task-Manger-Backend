const express = require("express");
const { protect, adminOnly} = require("../middlewares/authMiddleware");
const { getDashboardData, getUserDashboardData, getAllTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, updateTaskChecklist } = require("../controllers/taskController");


const router = express.Router();

// Task Management

router.get("/dashboard-data", protect, getDashboardData);
router.get("/user-dashboard", protect, getUserDashboardData);
router.get("/", protect, getAllTasks); // Get all task (Admin: all, User: Assigned)
router.get("/:id", protect, getTaskById); //    Get task by iD
router.post("/", protect, adminOnly, createTask); //Create a task Admin only
router.put("/:id", protect, updateTask); // Update task details
router.delete("/:id", protect, adminOnly, deleteTask); // Delete a task Admin only
router.put("/:id/status", protect, updateTaskStatus); // Update task status
router.put("/:id/todo", protect, updateTaskChecklist); // Update task checklist

module.exports = router;