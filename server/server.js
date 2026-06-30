const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4500;

// ==================== Cloudinary Config ====================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'visa-portal-docs',
    resource_type: 'auto',
    public_id: function (req, file) {
      return Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    }
  }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== MongoDB Connection ====================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visa_portal';

mongoose.connect(MONGO_URI)
  .then(() => console.log('? MongoDB connected'))
  .catch(err => {
    console.error('? MongoDB error:', err.message);
    process.exit(1);
  });

// ==================== Schemas ====================
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passport: { type: String, required: true },
  country: { type: String, required: true, enum: ['Norway', 'Serbia', 'Slovakia', 'Australia'] },
  amount: { type: String, default: '0' },
  step: { type: String, default: 'Pending' },
  password: { type: String, default: '' },
  visaType: { type: String, default: 'Tourist' },
  visaSubType: { type: String, default: '' },
  remainingDays: { type: Number, default: 0 },
  cancelled: { type: Boolean, default: false },
  cancelReason: { type: String, default: '' },
  processingOffice: { type: String, default: '' },
  applicationRef: { type: String, default: '' },
  trackingId: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

clientSchema.virtual('id').get(function() { return this._id.toString(); });

const paymentSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  amount: { type: String, required: true },
  method: { type: String, default: 'Cash' },
  note: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

paymentSchema.virtual('id').get(function() { return this._id.toString(); });

const docSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  fileType: { type: String, default: '' },
  category: { type: String, default: 'Other' },
  customLabel: { type: String, default: '' },
  url: { type: String, default: '' },
  publicId: { type: String, default: '' },
  uploadedAt: { type: String, default: () => new Date().toISOString() }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });
docSchema.virtual('id').get(function() { return this._id.toString(); });

const Client = mongoose.model('Client', clientSchema);
const Payment = mongoose.model('Payment', paymentSchema);
const Document = mongoose.model('Document', docSchema);

// ==================== Auth Middleware ====================
function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (token && token === 'Bearer admin-token-123') return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ==================== Admin Auth ====================
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({ token: 'admin-token-123' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ==================== Client CRUD ====================
app.get('/api/clients', authenticate, async (req, res) => {
  try {
    const { country, step } = req.query;
    let filter = {};
    if (country) filter.country = country;
    if (step) filter.step = step;
    const clients = await Client.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true });
    clients.forEach(c => { if (!c.id) c.id = c._id.toString(); });
    res.json(clients);
  } catch (e) { res.status(500).json({ error: 'Server error', details: e.message }); }
});

app.get('/api/clients/:id', authenticate, async (req, res) => {
  try {
    const c = await Client.findById(req.params.id).lean({ virtuals: true });
    if (!c) return res.status(404).json({ error: 'Client not found' });
    if (!c.id) c.id = c._id.toString();
    res.json(c);
  } catch (e) { res.status(500).json({ error: 'Server error', details: e.message }); }
});

app.post('/api/clients', authenticate, async (req, res) => {
  const { name, passport, country, amount, step, password, visaType, visaSubType, remainingDays, processingOffice, applicationRef, notes } = req.body;
  if (!name || !passport || !country || !step) return res.status(400).json({ error: 'Name, passport, country and step required' });
  try {
    const trackingId = 'VISA-' + country.toUpperCase().slice(0, 3) + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const c = await Client.create({
      name, passport, country,
      amount: amount ? amount.toString() : '0',
      step, visaType: visaType || 'Tourist',
      visaSubType: visaSubType || '',
      password: password || '',
      remainingDays: remainingDays || 0,
      processingOffice: processingOffice || '',
      applicationRef: applicationRef || '',
      trackingId,
      notes: notes || ''
    });
    res.status(201).json(c);
  } catch (e) { res.status(500).json({ error: 'Failed to create', details: e.message }); }
});

app.put('/api/clients/:id', authenticate, async (req, res) => {
  try {
    const updates = {};
    const fields = ['step', 'amount', 'password', 'visaType', 'visaSubType', 'remainingDays', 'cancelled', 'cancelReason', 'processingOffice', 'applicationRef', 'notes', 'name', 'passport', 'country'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    const c = await Client.findByIdAndUpdate(req.params.id, updates, { new: true }).lean({ virtuals: true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    if (!c.id) c.id = c._id.toString();
    res.json(c);
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

app.delete('/api/clients/:id', authenticate, async (req, res) => {
  try {
    const r = await Client.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

// ==================== Payments ====================
app.get('/api/payments', authenticate, async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 }).lean({ virtuals: true });
    payments.forEach(p => { if (!p.id) p.id = p._id.toString(); });
    res.json(payments);
  } catch (e) { res.status(500).json({ error: 'Server error', details: e.message }); }
});

app.post('/api/payments', authenticate, async (req, res) => {
  const { clientId, amount, method, note, createdAt } = req.body;
  if (!clientId || !amount) return res.status(400).json({ error: 'clientId and amount required' });
  try {
    const payData = {
      clientId, amount: amount.toString(), method: method || 'Cash', note: note || ''
    };
    if (createdAt) payData.createdAt = createdAt;
    const p = await Payment.create(payData);
    res.status(201).json(p);
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

// Update a payment
app.put('/api/payments/:id', authenticate, async (req, res) => {
  try {
    const updates = {};
    if (req.body.amount !== undefined) updates.amount = req.body.amount.toString();
    if (req.body.method !== undefined) updates.method = req.body.method;
    if (req.body.note !== undefined) updates.note = req.body.note;
    if (req.body.createdAt !== undefined) updates.createdAt = req.body.createdAt;
    const p = await Payment.findByIdAndUpdate(req.params.id, updates, { new: true, returnDocument: 'after' }).lean({ virtuals: true });
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    if (!p.id) p.id = p._id.toString();
    res.json(p);
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

// Delete a payment
app.delete('/api/payments/:id', authenticate, async (req, res) => {
  try {
    const p = await Payment.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

// ==================== Document Upload (Cloudinary) ====================
app.post('/api/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (!req.file.path) return res.status(500).json({ error: 'Upload to Cloudinary failed' });
    const { clientId, category, customLabel } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId required' });
    const doc = await Document.create({
      clientId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      category: category || 'Other',
      customLabel: customLabel || '',
      url: req.file.path,        // Cloudinary URL
      publicId: req.file.filename // Cloudinary public ID
    });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ error: 'Upload failed', details: e.message }); }
});

app.get('/api/documents/:clientId', authenticate, async (req, res) => {
  try {
    const docs = await Document.find({ clientId: req.params.clientId }).sort({ uploadedAt: -1 }).lean({ virtuals: true });
    docs.forEach(d => { if (!d.id) d.id = d._id.toString(); });
    res.json(docs);
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

app.delete('/api/documents/:id', authenticate, async (req, res) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    // Delete from Cloudinary
    if (doc.publicId) {
      try { await cloudinary.uploader.destroy(doc.publicId); } catch(e) {}
    }
    res.json({ message: 'Document deleted' });
  } catch (e) { res.status(500).json({ error: 'Failed', details: e.message }); }
});

// Public: get documents for a client (used by landing pages)
app.post('/api/public/documents', async (req, res) => {
  const { passport, password } = req.body;
  if (!passport || !password) return res.status(400).json({ error: 'Passport and password required' });
  try {
    const c = await Client.findOne({ passport }).lean();
    if (!c) return res.status(404).json({ error: 'No application found' });
    if (c.password && c.password !== password) return res.status(403).json({ error: 'Incorrect password' });
    const docs = await Document.find({ clientId: c.id || c._id.toString() }).sort({ uploadedAt: -1 }).lean({ virtuals: true });
    docs.forEach(d => { if (!d.id) d.id = d._id.toString(); });
    res.json(docs);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== Stats ====================
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const [clients, payments] = await Promise.all([
      Client.find().lean(), Payment.find().lean()
    ]);
    const byCountry = {};
    clients.forEach(c => {
      byCountry[c.country] = (byCountry[c.country] || 0) + 1;
    });
    res.json({
      totalClients: clients.length,
      pending: clients.filter(c => c.step === 'Pending').length,
      documentVerification: clients.filter(c => c.step === 'Document verification' || c.step === 'Checking Documents').length,
      resubmission: clients.filter(c => c.step === 'Re-submission of documents' || c.step === 'Re-submit Documents').length,
      confirmation: clients.filter(c => c.step === 'Confirmation of documents' || c.step === 'Documents Confirmed').length,
      approved: clients.filter(c => c.step === 'Visa approval' || c.step === 'Visa Approved').length,
      denied: clients.filter(c => c.step === 'Denial' || c.step === 'Rejected').length,
      cancelled: clients.filter(c => c.cancelled === true).length,
      byCountry,
      totalPayments: payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0),
      paymentCount: payments.length
    });
  } catch (e) { res.status(500).json({ error: 'Server error', details: e.message }); }
});

// ==================== Public Routes ====================
app.post('/api/public/verify', async (req, res) => {
  const { passport, password, country } = req.body;
  if (!passport || !password) return res.status(400).json({ error: 'Passport and password required' });
  try {
    let filter = { passport };
    if (country) filter.country = country;
    const c = await Client.findOne(filter).lean({ virtuals: true });
    if (!c) return res.status(404).json({ error: 'No application found with this passport number' });
    if (c.password && c.password !== password) return res.status(403).json({ error: 'Incorrect password. Please check your credentials.' });
    res.json({
      id: c.id || c._id.toString(),
      name: c.name,
      passport: c.passport,
      country: c.country,
      step: c.step,
      visaType: c.visaType || 'Tourist',
      visaSubType: c.visaSubType || '',
      remainingDays: c.remainingDays || 0,
      cancelled: c.cancelled || false,
      cancelReason: c.cancelReason || '',
      amount: c.amount,
      processingOffice: c.processingOffice || '',
      applicationRef: c.applicationRef || '',
      trackingId: c.trackingId || '',
      createdAt: c.createdAt
    });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/public/cancel', async (req, res) => {
  const { passport, password, reason } = req.body;
  if (!passport || !password) return res.status(400).json({ error: 'Passport and password required' });
  try {
    const c = await Client.findOne({ passport });
    if (!c) return res.status(404).json({ error: 'No application found' });
    if (c.password && c.password !== password) return res.status(403).json({ error: 'Incorrect password' });
    if (c.cancelled) return res.status(400).json({ error: 'Application is already cancelled' });
    c.cancelled = true;
    c.cancelReason = reason || 'No reason provided';
    c.step = 'Cancelled';
    await c.save();
    res.json({ message: 'Application has been cancelled successfully', cancelReason: c.cancelReason });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// ==================== Root route ====================
app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

// ==================== Country-specific page routes ====================
app.get('/track/:country', (req, res) => {
  const { country } = req.params;
  const validCountries = ['norway', 'serbia', 'slovakia', 'australia'];
  const normalized = country.toLowerCase();
  if (validCountries.includes(normalized)) {
    res.sendFile(path.join(__dirname, 'public', 'track-' + normalized + '.html'));
  } else {
    res.status(404).send('Country not found');
  }
});

// ==================== Start Server ====================
app.listen(PORT, () => {
  console.log('+--------------------------------------+');
  console.log('ï¿½    VISA PORTAL - AGENCY SYSTEM       ï¿½');
  console.log('ï¿½--------------------------------------ï¿½');
  console.log('ï¿½  Running at http://localhost:' + PORT + '      ï¿½');
  console.log('ï¿½  Admin: http://localhost:' + PORT + '/admin.html  ï¿½');
  console.log('+--------------------------------------+');
});

