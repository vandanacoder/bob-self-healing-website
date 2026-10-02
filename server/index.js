const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const ERRORS_FILE = path.join(__dirname, 'errors.json');

// Ensure errors.json exists with an empty array
if (!fs.existsSync(ERRORS_FILE)) {
  fs.writeFileSync(ERRORS_FILE, '[]', 'utf8');
}

app.use(cors());
app.use(express.json());

// POST /api/errors — append a new error entry
app.post('/api/errors', (req, res) => {
  const { message, file, line, time } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const entry = {
    id: Date.now(),
    message: String(message),
    file: String(file || 'unknown'),
    line: line != null ? Number(line) : null,
    time: time || new Date().toISOString(),
  };

  let errors = [];
  try {
    errors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
  } catch {
    errors = [];
  }

  errors.push(entry);
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2), 'utf8');

  console.log(`[error logged] ${entry.time} — ${entry.message}`);
  res.status(201).json(entry);
});

// GET /api/errors — return all errors (newest first)
app.get('/api/errors', (req, res) => {
  let errors = [];
  try {
    errors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
  } catch {
    errors = [];
  }
  res.json([...errors].reverse());
});

// PATCH /api/errors — mark ALL open errors as healed
app.patch('/api/errors', (req, res) => {
  let errors = [];
  try {
    errors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
  } catch {
    errors = [];
  }

  errors.forEach((e) => { e.healed = true; });
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2), 'utf8');
  res.json(errors);
});

// PATCH /api/errors/:id — mark an error as healed
app.patch('/api/errors/:id', (req, res) => {
  let errors = [];
  try {
    errors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
  } catch {
    errors = [];
  }

  const id = Number(req.params.id);
  const entry = errors.find((e) => e.id === id);
  if (!entry) return res.status(404).json({ error: 'not found' });

  entry.healed = true;
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2), 'utf8');
  res.json(entry);
});

// DELETE /api/errors — clear all errors
app.delete('/api/errors', (req, res) => {
  fs.writeFileSync(ERRORS_FILE, '[]', 'utf8');
  res.json({ cleared: true });
});

app.listen(PORT, () => {
  console.log(`Self-Healing Site server running on http://localhost:${PORT}`);
});
