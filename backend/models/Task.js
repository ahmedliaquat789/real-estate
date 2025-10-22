const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dueDate: { type: String },
  priority: { type: String, enum: ['Urgent', 'High', 'Medium', 'Low', 'None'], default: 'None' },
  assignedTo: { type: String },
  status: { type: String, enum: ['active', 'complete'], default: 'active' },
  notes: { type: String },
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskList', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema); 