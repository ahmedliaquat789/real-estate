const Task = require('../models/Task');
const TaskList = require('../models/TaskList');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    // Validate list
    if (!req.body.list) return res.status(400).json({ error: 'Task list is required' });
    const list = await TaskList.findById(req.body.list);
    if (!list) return res.status(404).json({ error: 'Task list not found' });
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get tasks (optionally filter by list ObjectId)
exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.list) filter.list = req.query.list;
    const tasks = await Task.find(filter).populate('list').sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; 