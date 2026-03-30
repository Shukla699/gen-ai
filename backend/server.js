
require('dotenv').config();
const express = require('express');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.route');
const dashboardRoutes = require('./src/routes/dashboard.route');
const cookie = require('cookie-parser');
const cors = require('cors');

connectDB();

app.use(cors());
app.use(cookie());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth/', authRoutes);
app.use('/api/dashboard/', dashboardRoutes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});