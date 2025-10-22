const mongoose = require('mongoose');

const TaskListSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: String }, // Optionally associate with a user
}, { timestamps: true });

module.exports = mongoose.model('TaskList', TaskListSchema); 