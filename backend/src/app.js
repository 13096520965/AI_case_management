const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Legal Case Management System API is running' });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cases', require('./routes/case'));
app.use('/api/parties', require('./routes/party'));
app.use('/api/nodes', require('./routes/processNode'));
app.use('/api/templates', require('./routes/processTemplate'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/documents', require('./routes/document'));
app.use('/api/document-templates', require('./routes/documentTemplate'));
app.use('/api/costs', require('./routes/cost'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/archive', require('./routes/archive'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api', require('./routes/caseLog'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

const PORT = process.env.PORT || 3000;

// 启动提醒调度器
const notificationScheduler = require('./services/notificationScheduler');

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // 启动提醒调度器
  notificationScheduler.start();
});

module.exports = app;
