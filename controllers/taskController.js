const Task = require("../models/Task");
const User = require("../models/User"); // Add this line at the top


// @desc  Get all Task ( Admin: all, User: only assigned task)
// @desc GET /api/tasks/
// @desc Private
const getAllTasks = async (req, res) => {
    try {
      const { status } = req.query;
      const filter = status ? { status } : {};
  
      const tasks = await Task.find(filter)
        .populate("assignedTo", "profileImageUrl name"); // populate assignedTo
  
      const statusSummary = {
        all: await Task.countDocuments(),
        pendingTasks: await Task.countDocuments({ status: "Pending" }),
        inProgressTasks: await Task.countDocuments({ status: "In Progress" }),
        completedTask: await Task.countDocuments({ status: "Completed" }),
      };
  
      res.json({
        task: tasks,
        statusSummary,
      });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  
  
  

// @desc  Get task by Id
// @routes  Get /api/tasks/:id
// @access Private
const getTaskById = async (req, res) => {
    try {
         const task  = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
         );

         if(!task) return res.status(404).json({ message: "Task not found"});

         res.json(task)
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
};


// @desc   Create a new task (Admin only)
// @routes  POST /api/tasks/
// @access private (Admin)
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
        } = req.body;

        if(!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user IDs"});
        }

    const task = await  Task.create({
        title,
        description,
        priority,
        dueDate,
        assignedTo,
        createdBy: req.user._id,
        attachments,
        todoChecklist,
    });

    res.status(200).json({ message: "Task created succesfully", task})
        


    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}


// @desc   Update task (Admin only)
// @routes  Put /api/tasks/:id
// @access private (Admin)
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if(!task) return res.status(404).json({ message: "Task not found"});

        task.title = req.body.title || task.title;
        task.description = req.body.description  || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.todoCheckList = req.body.todoCheckList || task.todoCheckList;
        task.attachments = req.body.attachments || task.attachments;

        if(req.body.assignedTo) {
            if(!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be an array of user IDs"});
            }
            task.assignedTo = req.body.assignedTo;
        }

        const updatedTask = await task.save();
        res.json({ message: "Task updated succesfully", updatedTask});
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

// @desc   delete task (Admin only)
// @routes  Delete /api/tasks/:id
// @access private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if(!task) return res.status(404).json({ message: "Task not found"});

        await task.deleteOne();
        res.json({ message: "Task deleted successfully"})
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

// @desc  Update task status 
// @route PUT /api/tasks/status
// @access Private
const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if(!task) return res.status(404).json({ message: "Task not found"});

        const isAssigned = task.assignedTo.some(
            (userId) => userId.toString() === req.user._id.toString()
        );

        if (!isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized"});
        }

        task.status = req.body.status || task.status;

        if(task.status === "Completed") {
            task.todoChecklist.forEach((item) => (item.completed = true));
            task.progress = 100;
        }

        await task.save();
        res.json({ message: "Task status updated", task});
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}


// @desc Update task Checklist
// @eroutes PUT /api/tasks/:id/todo
// @access Private
const updateTaskChecklist = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if(!task) return res.status(404).json({ message: "Task not found"});

        if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized"});
        }

        task.todoChecklist = req.body.todoChecklist; // Use the value from request body

        //Auto-update progress based on checklist completion
        const completedCount = task.todoChecklist.filter(
            (item) => item.completed
        ).length;
        const totalItems = task.todoChecklist.length;
        task.progress = Math.round((completedCount / totalItems) * 100);


        // auto-mark task as completed if all checklist items are done
        if(task.progress === 100) {
            task.status = "Completed";
        }else if(task.progress > 0) {
            task.status = "In Progress";
        }else{
            task.status = "Pending";
        }


        await task.save();
       const updatedTask = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );
        res.json({ message: "Task checklist updated",task: updatedTask});

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}


// @desc Dashboard Data (Admin Only)
// @eroutes PUT /api/tasks/dashboard-data
// @access Private
const getDashboardData = async (req, res) => {
    try {
      const totalTasks = await Task.countDocuments();
      const pendingTasks = await Task.countDocuments({ status: "Pending" });
      const completedTasks = await Task.countDocuments({ status: "Completed" });
      const inProgressTasks = await Task.countDocuments({ status: "In Progress" });
  
      const taskDistribution = {
        All: totalTasks,
        Pending: pendingTasks,
        InProgress: inProgressTasks,
        Completed: completedTasks,
      };
  
      const recentTasks = await Task.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("title status priority dueDate createdAt");
  
      res.status(200).json({
        charts: {
          taskDistribution,
        },
        recentTasks,
      });
  
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  



// @desc Dashboard data ( User-specific)
// @eroutes PUT /api/tasks/user-dashboard-data
// @access Private
const getUserDashboardData = async (req, res) => {
    try {
        const userId = req.user._id;  // Ensure this is set correctly

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Fetch statistics for user-specific tasks
        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({
            assignedTo: userId,
            status: "Pending",
        });
        const completedTasks = await Task.countDocuments({
            assignedTo: userId,
            status: "Completed",
        });
        const overdueTasks = await Task.countDocuments({
            assignedTo: userId,
            dueDate: { $lt: new Date() },
            status: { $ne: "Completed" },
        });

        // Task distribution by status
        const taskStatuses = ["Pending", "In Progress", "Completed"];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");  // Correct usage
            const distribution = taskDistributionRaw.find(item => item._id === status);
            acc[formattedKey] = distribution ? distribution.count : 0;
            return acc;
        }, {});
        taskDistribution["ALL"] = totalTasks;

        // Task distribution by priority
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            const priorityDistribution = taskPriorityRaw.find(item => item._id === priority);
            acc[priority] = priorityDistribution ? priorityDistribution.count : 0;
            return acc;
        }, {});

        // Fetch recent 10 tasks for the logged-in user
        const recentTasks = await Task.find({ assignedTo: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select("title status priority dueDate createdAt");

        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks,
            },
            charts: {
                taskDistribution,
                taskPriorityLevels,
            },
            recentTasks,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,

};