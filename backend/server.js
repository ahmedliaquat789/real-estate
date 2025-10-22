const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const dealRoutes = require('./routes/deals');
const expenseRoutes = require('./routes/expenses');
const taskRoutes = require('./routes/tasks');
const taskListRoutes = require('./routes/taskLists');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-lists', taskListRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.listen(5000, () => console.log('Server running on port 5000'));
