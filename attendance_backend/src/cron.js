const attendanceController = require("./controllers/attendance.controller");

const initCronJobs = () => {
  // Run every 60 seconds
  setInterval(async () => {
    try {
      await attendanceController.closeExpiredSessions();
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  }, 60 * 1000);
  
  console.log("Cron jobs initialized: Checking for expired sessions every 60s.");
};

module.exports = initCronJobs;
