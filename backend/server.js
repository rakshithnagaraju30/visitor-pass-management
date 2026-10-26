require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DBConnection = require('./databaseConnection');
const { requireAuth, allowRoles } = require('./middleware/auth-middleware');

const { setServers } = require("node:dns");
setServers(["8.8.8.8", "1.1.1.1"]);

const organizationRoutes = require("./routes/organization-routes");
const authRoutes = require('./routes/auth-route');
const userRoutes = require('./routes/user-route');
const visitorRoutes = require('./routes/visitor-route');
const appointmentRoutes = require('./routes/appointment-route');
const passRoutes = require('./routes/pass-route');
const checkLogRoutes = require('./routes/check-log-route');
const workflowRoutes = require('./routes/visit-workflow-route');
const dashboardRoutes = require('./routes/dashboard-route');

const app = express();
// Running behind Nginx in Docker; trust the first proxy hop for client IPs
app.set('trust proxy', 1);
// Browsers send origins without a trailing slash, so strip any from the configured list
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((origin) => origin.trim().replace(/\/+$/, ''));
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', requireAuth, allowRoles('admin'), userRoutes);
app.use('/api/visitors', requireAuth, allowRoles('admin', 'employee', 'security'), visitorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', requireAuth, allowRoles('admin', 'employee', 'security'), passRoutes);
app.use('/api/check-logs', requireAuth, allowRoles('admin', 'security'), checkLogRoutes);
app.use('/api/visits', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use((req, res) => res.status(404).json({ message: 'API endpoint not found' }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Unexpected server error' });
});

const PORT = process.env.PORT || 4000;
DBConnection()
  .then(() => app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)))
  .catch((error) => {
    console.error('Server could not start because MongoDB connection failed:', error.message);
    process.exit(1);
  });
