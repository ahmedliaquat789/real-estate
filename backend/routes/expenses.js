const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Account = require('../models/Account');
const Company = require('../models/Company');

// Get all expenses for a project
router.get('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.expenses || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new expense to a project
router.post('/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const expense = req.body;
    project.expenses.push(expense);
    await project.save();
    res.status(201).json(project.expenses[project.expenses.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an expense from a project
router.delete('/:projectId/:expenseId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.expenses = project.expenses.filter(e => e._id.toString() !== req.params.expenseId);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an expense in a project
router.put('/:projectId/:expenseId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const idx = project.expenses.findIndex(e => e._id.toString() === req.params.expenseId);
    if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
    project.expenses[idx] = { ...project.expenses[idx]._doc, ...req.body };
    await project.save();
    res.json(project.expenses[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Account Endpoints ---
// Get all accounts for a project
router.get('/accounts/:projectId', async (req, res) => {
  try {
    const accounts = await Account.find({ projectId: req.params.projectId });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add a new account
router.post('/accounts/:projectId', async (req, res) => {
  try {
    const account = new Account({ ...req.body, projectId: req.params.projectId });
    await account.save();
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete an account
router.delete('/accounts/:projectId/:accountId', async (req, res) => {
  try {
    await Account.deleteOne({ _id: req.params.accountId, projectId: req.params.projectId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update an account
router.put('/accounts/:projectId/:accountId', async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.accountId, projectId: req.params.projectId },
      req.body,
      { new: true }
    );
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Company Endpoints ---
// Get all companies for a project
router.get('/companies/:projectId', async (req, res) => {
  try {
    const companies = await Company.find({ projectId: req.params.projectId });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add a new company
router.post('/companies/:projectId', async (req, res) => {
  try {
    const company = new Company({ ...req.body, projectId: req.params.projectId });
    await company.save();
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete a company
router.delete('/companies/:projectId/:companyId', async (req, res) => {
  try {
    await Company.deleteOne({ _id: req.params.companyId, projectId: req.params.projectId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update a company
router.put('/companies/:projectId/:companyId', async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { _id: req.params.companyId, projectId: req.params.projectId },
      req.body,
      { new: true }
    );
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Income Endpoints ---
// Get all incomes for a project
router.get('/incomes/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.incomes || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Add a new income to a project
router.post('/incomes/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const income = req.body;
    // Validation
    if (!income.date || !income.description || !income.type || !income.amount) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    project.incomes.push(income);
    await project.save();
    res.status(201).json(project.incomes[project.incomes.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete an income from a project
router.delete('/incomes/:projectId/:incomeId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.incomes = project.incomes.filter(i => i._id.toString() !== req.params.incomeId);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update an income in a project
router.put('/incomes/:projectId/:incomeId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const idx = project.incomes.findIndex(i => i._id.toString() === req.params.incomeId);
    if (idx === -1) return res.status(404).json({ error: 'Income not found' });
    project.incomes[idx] = { ...project.incomes[idx]._doc, ...req.body };
    await project.save();
    res.json(project.incomes[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
