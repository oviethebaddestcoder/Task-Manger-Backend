const express = require("express");
const { exportTasksReport, exportUsersReport } = require("../controllers/reportContoller");
const { protect, adminOnly } = require("../middlewares/authMiddleware");


const router = express.Router();

router.get("/export/tasks", protect,adminOnly,exportTasksReport);
router.get("/export/users", protect,adminOnly,exportUsersReport);




module.exports = router;