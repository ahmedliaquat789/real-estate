const express = require('express');
const router = express.Router();
const taskListController = require('../controllers/taskListController');

// Create a new task list
router.post('/', taskListController.createTaskList);
// Get all task lists
router.get('/', taskListController.getTaskLists);
// Get task counts for all lists
router.get('/counts', taskListController.getTaskCounts);
// Delete a task list
router.delete('/:id', taskListController.deleteTaskList);

module.exports = router;
 