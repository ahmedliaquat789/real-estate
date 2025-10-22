const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  photos: [String],
  displayAt: { type: Date, default: Date.now },
});

const PhotoLogSchema = new mongoose.Schema({
  url: { type: String, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  filename: String,
  originalname: String,
});

const ExpenseSchema = new mongoose.Schema({
  date: String,
  invoiceNo: String,
  description: String,
  account: String,
  company: String,
  category: String,
  className: String,
  amount: String,
  tax: String,
  file: String,
}, { _id: true });

const IncomeSchema = new mongoose.Schema({
  date: String,
  description: String,
  type: String,
  amount: String,
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  address1: { type: String, required: true },
  address2: String,
  city: { type: String, required: true },
  state: String,
  postalCode: String,
  country: { type: String, required: true },
  projectName: { type: String, required: true },
  strategy: { type: String, required: true },
  stage: { type: String, required: true },
  updates: [UpdateSchema],
  archived: { type: Boolean, default: false },
  location: {
    type: {
    lat: Number,
    lng: Number
    },
    default: undefined
  },
  propertySpecs: {
    propertyType: String,
    propertyStyle: String,
    basement: String,
    parking: String,
    yearBuilt: String,
    noOfUnits: Number,
    stories: Number,
    rooms: Number,
    garages: Number,
    squareFeet: Number,
    beds: Number,
    fullBaths: Number,
    halfBaths: Number,
    lotSize: Number,
    lotSizeUnit: String,
    lotFrontage: Number,
    lotDepth: Number,
    landUse: String,
  },
  ownerData: {
    leadTemperature: String,
    leadSource: String,
    leadNotes: String,
  },
  flipAnalyzer: {
    arv: Number,
    purchasePrice: Number,
    repairCost: Number,
    repairCostType: String, // 'lumpSum' or 'perSF'
    repairCostPerSF: Number,
    repairCostSF: Number,
    buyingCosts: Number,
    holdingCosts: Number,
    sellingCosts: Number,
    financingType: String, // 'cash' or 'loan'
    financingCosts: Number,
    desiredProfit: Number,
    step: Number, // last completed step
    finished: Boolean, // whether analysis is finished
    lastUpdated: { type: Date, default: Date.now },
    results: { type: Array, default: [] }, // <-- persist results array
  },
  brrrrAnalyzer: {
    phase1: { type: Array, default: [] },
    phase2: { type: Array, default: [] },
    phase2Inputs: { type: Object, default: {} }, // <-- add this
    financingStrategy: { type: String, default: 'cash' },
    results: { type: Object, default: {} },
    finished: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  photoLog: [PhotoLogSchema],
  budget: {
    type: Object,
    default: {},
  },
  incomes: [IncomeSchema],
  expenses: [ExpenseSchema],
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
