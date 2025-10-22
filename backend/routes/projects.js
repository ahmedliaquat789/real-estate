const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose'); // Add at the top if not present

// Helper function to geocode address
async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'your-api-key';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await axios.get(url);
  if (res.data.status === 'OK') {
    return res.data.results[0].geometry.location; // { lat, lng }
  }
  return null;
}

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'));
  },
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new project
router.post('/', auth, async (req, res) => {
  const {
    address1, address2, city, state, postalCode, country,
    projectName, strategy, stage
  } = req.body;
  try {
    const address = `${address1}, ${address2 ? address2 + ', ' : ''}${city}, ${state || ''}, ${postalCode || ''}, ${country}`;
    console.log("[Add Project] Geocoding address:", address);
    const location = await geocodeAddress(address);
    console.log("[Add Project] Geocoded location:", location);
    if (!location) {
      return res.status(400).json({ error: "Could not geocode address. Please enter a valid, complete address." });
    }
    const project = await Project.create({
      address1, address2, city, state, postalCode, country,
      projectName, strategy, stage, location
    });
    res.json(project);
  } catch (err) {
    console.error("[Add Project] Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get a single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a project by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a project by ID
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Check if address fields are changing
    const addressFields = ['address1', 'address2', 'city', 'state', 'postalCode', 'country'];
    let addressChanged = false;
    for (const field of addressFields) {
      if (req.body[field] && req.body[field] !== project[field]) {
        addressChanged = true;
        break;
      }
    }
    let location = project.location;
    if (addressChanged) {
      const address = `${req.body.address1 || project.address1}, ${req.body.address2 || project.address2 ? (req.body.address2 || project.address2) + ', ' : ''}${req.body.city || project.city}, ${req.body.state || project.state || ''}, ${req.body.postalCode || project.postalCode || ''}, ${req.body.country || project.country}`;
      console.log("[Update Project] Geocoding address:", address);
      location = await geocodeAddress(address);
      console.log("[Update Project] Geocoded location:", location);
      if (!location) {
        return res.status(400).json({ error: "Could not geocode address. Please enter a valid, complete address." });
      }
    }
    const updated = await Project.findByIdAndUpdate(req.params.id, { ...req.body, location }, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("[Update Project] Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all updates for a project
router.get('/:id/updates', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.updates.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new update for a project
router.post('/:id/updates', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Only pick allowed fields
    const { title, description, photos, displayAt } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    let displayAtDate = new Date();
    if (displayAt && !isNaN(new Date(displayAt).getTime())) {
      displayAtDate = new Date(displayAt);
    }
    const update = {
      title,
      description,
      author: req.user.name || req.user.email,
      photos: photos || [],
      displayAt: displayAtDate,
      createdAt: new Date(),
    };

    project.updates.push(update);
    await project.save();
    res.json(project.updates[project.updates.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Edit an update for a project
router.put('/:id/updates/:updateId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const update = project.updates.id(req.params.updateId);
    if (!update) return res.status(404).json({ error: 'Update not found' });
    Object.assign(update, req.body);
    await project.save();
    res.json(update);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an update for a project
router.delete('/:id/updates/:updateId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const update = project.updates.id(req.params.updateId);
    if (!update) return res.status(404).json({ error: 'Update not found' });
    project.updates.pull(update._id);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Duplicate a project by ID
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await Project.findById(req.params.id);
    if (!original) return res.status(404).json({ error: 'Project not found' });
    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.archived;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    duplicateData.projectName = `Copy of ${original.projectName}`;
    // Optionally, reset stage or other fields if needed
    const newProject = await Project.create(duplicateData);
    res.json(newProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get property specs for a project
router.get('/:id/property-specs', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.propertySpecs || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update property specs for a project
router.put('/:id/property-specs', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.propertySpecs = req.body;
    await project.save();
    res.json(project.propertySpecs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get owner data for a project
router.get('/:id/owner-data', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.ownerData || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update owner data for a project
router.put('/:id/owner-data', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.ownerData = req.body;
    await project.save();
    res.json(project.ownerData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Flip Analyzer data for a project
router.get('/:id/flip-analyzer', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.flipAnalyzer || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Flip Analyzer data for a project
router.put('/:id/flip-analyzer', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.flipAnalyzer = { ...project.flipAnalyzer, ...req.body, lastUpdated: new Date() };
    await project.save();
    res.json(project.flipAnalyzer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get BRRRR Analyzer data for a project
router.get('/:id/brrrr-analyzer', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.brrrrAnalyzer || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update BRRRR Analyzer data for a project
router.put('/:id/brrrr-analyzer', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Calculate projections if finished
    let results = project.brrrrAnalyzer.results || {};
    if (req.body.finished && req.body.phase1 && req.body.phase2) {
      const phase1 = req.body.phase1;
      const phase2 = req.body.phase2;
      // Cash Needed Over Time
      const cashNeededOverTime = [
        { x: 'Closing', y: phase1[1]?.value ? -Math.abs(phase1[1].value) : 0 },
        { x: 'Stabilized', y: phase1[4]?.value ? -Math.abs(phase1[4].value) : 0 },
        { x: 'After Refi', y: phase2?.refiAmount ? -Math.abs(phase2.refiAmount) : 0 }
      ];
      // Long-Term Returns (simple projection for demo)
      const years = phase2.years || 15;
      const baseEquity = phase1[0]?.value || 0;
      const appreciation = 0.03; // 3% annual appreciation (example)
      const netCashFlow = (phase2[6]?.perYear || 0); // Cash Flow Before Debt per year
      let longTermReturns = [];
      let totalReturn = baseEquity;
      let cumEquity = baseEquity;
      let cumAppreciation = 0;
      let cumNetCashFlow = 0;
      for (let y = 1; y <= years; y++) {
        cumAppreciation += baseEquity * Math.pow(1 + appreciation, y) - baseEquity;
        cumNetCashFlow += netCashFlow;
        totalReturn = baseEquity + cumAppreciation + cumNetCashFlow;
        longTermReturns.push({
          x: `Year ${y}`,
          equity: Math.round(cumEquity),
          appreciation: Math.round(cumAppreciation),
          netCashFlow: Math.round(cumNetCashFlow),
          totalReturn: Math.round(totalReturn)
        });
      }
      results = { cashNeededOverTime, longTermReturns };
    }
    project.brrrrAnalyzer = {
      ...project.brrrrAnalyzer,
      ...req.body,
      phase2Inputs: req.body.phase2Inputs || project.brrrrAnalyzer.phase2Inputs,
      financingStrategy: req.body.financingStrategy || project.brrrrAnalyzer.financingStrategy,
      results,
      lastUpdated: new Date()
    };
    await project.save();
    res.json(project.brrrrAnalyzer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upload photo(s) to photo log
router.post('/:id/photo-log', auth, upload.array('photos', 10), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const newPhotos = req.files.map(file => ({
      _id: new mongoose.Types.ObjectId(),
      url: `/uploads/${file.filename}`,
      filename: file.originalname,        // <-- User-friendly/original name
      storedFilename: file.filename,      // <-- Actual stored filename
      date: new Date(),
      description: '',
    }));
    project.photoLog.push(...newPhotos);
    await project.save();
    res.json(newPhotos);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Get all photo log entries for a project
router.get('/:id/photo-log', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.photoLog || []);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a photo from a project's photo log
router.delete('/:id/photo-log/:photoId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const photoIndex = project.photoLog.findIndex(photo => photo._id.toString() === req.params.photoId);
    if (photoIndex === -1) return res.status(404).json({ error: 'Photo not found' });

    project.photoLog.splice(photoIndex, 1);
    await project.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update photo details (date, description)
router.put('/:id/photo-log/:photoId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const photo = project.photoLog.id(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    if (req.body.date) photo.date = req.body.date;
    if (req.body.description !== undefined) photo.description = req.body.description;

    await project.save();
    res.json(photo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/photo-log/:photoId/download', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const photo = project.photoLog.id(req.params.photoId);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });

    const filePath = path.join(__dirname, '../uploads', photo.storedFilename || photo.filename);
    // Always serve as .jpg
    let downloadName = (photo.filename || 'photo').replace(/\.[^/.]+$/, '') + '.jpg';
    res.download(filePath, downloadName);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get budget for a project
router.get('/:id/budget', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.budget || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update budget for a project
router.put('/:id/budget', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    project.budget = req.body;
    await project.save();
    res.json(project.budget);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
