const Task = require('../models/Task');
const User = require('../models/User');
const excelJS = require('exceljs');

// @desc Export all tasks
// @route GET /api/reports/export/tasks
// @access Private
const exportTasksReport = async (req, res) => {
    try {
        const tasks = await Task.find({}).populate("assignedTo", 'name email');
        
        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found to export" });
        }

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tasks Report');

        // Define columns
        worksheet.columns = [
            { header: 'Task ID', key: '_id', width: 25 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Description', key: 'description', width: 50 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Priority', key: 'priority', width: 20 },
            { header: 'Due Date', key: 'dueDate', width: 20 },
            { header: 'Assigned To', key: 'assignedTo', width: 30 },
        ];

        // Add rows
        tasks.forEach((task) => {
            const assignedTo = task.assignedTo
                .map((user) => `${user.name} (${user.email})`)
                .join(', ');
            worksheet.addRow({
                _id: task._id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? task.dueDate.toLocaleDateString() : "Not Set", // Handle missing due date with locale formatting
                assignedTo: assignedTo || "Unassigned",
            });
        });

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=tasks_report_${Date.now()}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export tasks error:', error);
        res.status(500).json({ 
            message: "Failed to export tasks report", 
            error: error.message 
        });
    }
};

// @desc Export user-task report
// @route GET /api/reports/export/users
// @access Private (Admin only)
const exportUsersReport = async (req, res) => {
    try {
        const users = await User.find().select("name email_id").lean();
        const userTasks = await Task.find().populate(
            "assignedTo",
            "name email_id"
        );

        if (!users.length || !userTasks.length) {
            return res.status(404).json({ message: "No user or task data available for report" });
        }

        const userTaskMap = {};
        users.forEach((user) => {
            userTaskMap[user._id] = {
                name: user.name,
                email: user.email_id,  // Ensure you use the correct field for the email
                taskCount: 0,
                pendingTasks: 0,
                inProgressTasks: 0,
                completedTasks: 0,
            };
        });

        userTasks.forEach((task) => {
            if (task.assignedTo) {
                task.assignedTo.forEach((assignedUser) => {
                    if (userTaskMap[assignedUser._id]) {
                        userTaskMap[assignedUser._id].taskCount += 1;
                        if (task.status === "Pending") {
                            userTaskMap[assignedUser._id].pendingTasks += 1;
                        } else if (task.status === "In Progress") {
                            userTaskMap[assignedUser._id].inProgressTasks += 1;
                        } else if (task.status === "Completed") {
                            userTaskMap[assignedUser._id].completedTasks += 1;
                        }
                    }
                });
            }
        });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("User Task Report");

        worksheet.columns = [
            { header: "User Name", key: "name", width: 30 },
            { header: "Email", key: "email", width: 40 },
            { header: "Total Assigned Tasks", key: "taskCount", width: 20 },
            { header: "Pending Tasks", key: "pendingTasks", width: 20 },
            { header: "In Progress Tasks", key: "inProgressTasks", width: 20 },
            { header: "Completed Tasks", key: "completedTasks", width: 20 },
        ];

        Object.values(userTaskMap).forEach((user) => {
            worksheet.addRow(user);
        });

        // Set response headers for file download
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        });
        
    } catch (error) {
        console.error('Export users report error:', error);
        res.status(500).json({ message: "Error exporting users report", error: error.message });
    }
};

module.exports = {
    exportTasksReport,
    exportUsersReport,
};
