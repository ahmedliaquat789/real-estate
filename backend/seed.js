require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');
const Project = require('./models/Project');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Add a user
  await User.create({ name: 'Admin', email: 'admin', password: 'admin123' });

  // Add a project with all required fields
  await Project.create({
    address1: '123 Main St',
    address2: 'Suite 100',
    city: 'Karachi',
    state: 'Sindh',
    postalCode: '12345',
    country: 'Pakistan',
    projectName: 'Real Estate Project',
    strategy: 'Buy and Hold',
    stage: 'Planning'
  });

  console.log('Seed data inserted');
  process.exit();
};

// --- BRRRR Analyzer Migration ---
const migrateBRRRRAnalyzerArrays = async () => {
  const Project = require('./models/Project');
  const projects = await Project.find({});
  let updated = 0;
  for (const project of projects) {
    let changed = false;
    if (project.brrrrAnalyzer) {
      if (project.brrrrAnalyzer.phase1 && !Array.isArray(project.brrrrAnalyzer.phase1)) {
        project.brrrrAnalyzer.phase1 = [];
        changed = true;
      }
      if (project.brrrrAnalyzer.phase2 && !Array.isArray(project.brrrrAnalyzer.phase2)) {
        project.brrrrAnalyzer.phase2 = [];
        changed = true;
      }
      if (changed) {
        await project.save();
        updated++;
      }
    }
  }
  console.log(`BRRRR Analyzer migration complete. Updated ${updated} projects.`);
};

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 'your-api-key';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await axios.get(url);
  if (res.data.status === 'OK') {
    return res.data.results[0].geometry.location; // { lat, lng }
  }
  return null;
}

async function updateAllProjectsWithLocation() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/real-estate');
  const projects = await Project.find({});
  for (const project of projects) {
    if (!project.location || !project.location.lat || !project.location.lng) {
      const address = `${project.address1}, ${project.address2 ? project.address2 + ', ' : ''}${project.city}, ${project.state || ''}, ${project.postalCode || ''}, ${project.country}`;
      console.log(`Geocoding: ${address}`);
      const location = await geocodeAddress(address);
      if (location) {
        project.location = location;
        await project.save();
        console.log(`Updated project ${project._id} with location:`, location);
      } else {
        console.log(`Failed to geocode project ${project._id}`);
      }
    }
  }
  await mongoose.disconnect();
  console.log('Done updating all projects with location.');
}

if (require.main === module) {
  seed();
  migrateBRRRRAnalyzerArrays().then(() => process.exit(0));
  updateAllProjectsWithLocation();
}
