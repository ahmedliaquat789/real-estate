const TaskList = require('../models/TaskList');
const Task = require('../models/Task');

// Create a new task list
exports.createTaskList = async (req, res) => {
  try {
    const list = new TaskList(req.body);
    await list.save();
    res.status(201).json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all task lists
exports.getTaskLists = async (req, res) => {
  try {
    const lists = await TaskList.find().sort({ createdAt: 1 });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a task list
exports.deleteTaskList = async (req, res) => {
  try {
    const list = await TaskList.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ error: 'Task list not found' });
    res.json({ message: 'Task list deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get task counts for all lists
exports.getTaskCounts = async (req, res) => {
  try {
    const lists = await TaskList.find();
    const counts = {};
    for (const list of lists) {
      counts[list._id] = await Task.countDocuments({ list: list._id });
    }
    res.json(counts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};