const app = require("./src/app");
const initCronJobs = require("./src/cron");

const PORT = process.env.PORT || 5000;

// Initialize Background Jobs
initCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
