const express = require('express');
const dotenv = require('dotenv');
const DBConnection = require('./databaseConnection');
const cors = require('cors');

dotenv.config();

const userRoutes = require('./routes/user-route');
const visitorRoutes = require('./routes/visitor-route');
const appointmentRoutes = require('./routes/appointment-route');
const passRoutes = require('./routes/pass-route');
const checkLogRoutes = require('./routes/check-log-route');

const { setServers } = require("node:dns");
setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/check-logs', checkLogRoutes);

DBConnection();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

