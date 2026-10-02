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

// POST /api/explain — return a rule-based cause and fix for a given error message
app.post('/api/explain', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const msg = String(message).toLowerCase();

  const rules = [
    {
      match: (m) => /cannot read propert|undefined is not an object|typeerror.*undefined|typeerror.*null/.test(m),
      cause: 'A property was read on a value that is undefined or null.',
      fix: 'Check that the object exists before accessing its property (e.g. use optional chaining: obj?.prop).',
    },
    {
      match: (m) => /is not a function/.test(m),
      cause: 'A value that is not a function was called as one.',
      fix: 'Verify the variable holds the expected function before calling it, and check for typos in the method name.',
    },
    {
      match: (m) => /fetch|network|failed to fetch|networkerror|net::err|econnrefused|enotfound/.test(m),
      cause: 'A network or API call failed to reach its target.',
      fix: 'Confirm the API server is running, the URL is correct, and CORS headers are set appropriately.',
    },
    {
      match: (m) => /404/.test(m),
      cause: 'The requested resource was not found on the server.',
      fix: 'Verify the URL path and ensure the server route or file exists.',
    },
    {
      match: (m) => /500|internal server error/.test(m),
      cause: 'The server encountered an unexpected condition while processing the request.',
      fix: 'Check the server logs for the underlying exception and fix the handler that threw it.',
    },
    {
      match: (m) => /401|unauthorized/.test(m),
      cause: 'The request lacked valid authentication credentials.',
      fix: 'Ensure the correct token or credentials are included in the request headers.',
    },
    {
      match: (m) => /403|forbidden/.test(m),
      cause: 'The server understood the request but refused to authorize it.',
      fix: 'Check that the user has the required permissions for this resource.',
    },
    {
      match: (m) => /syntaxerror|unexpected token|unexpected end of json/.test(m),
      cause: 'The code or a JSON payload contains a syntax error.',
      fix: 'Review the flagged file and line number for malformed syntax or an invalid JSON string.',
    },
    {
      match: (m) => /referenceerror/.test(m),
      cause: 'A variable was used that has not been declared.',
      fix: 'Declare the variable before use and check for spelling mistakes.',
    },
    {
      match: (m) => /rangeerror|maximum call stack|stack overflow/.test(m),
      cause: 'A function called itself recursively without a proper base case.',
      fix: 'Add or correct the termination condition in the recursive function.',
    },
    {
      match: (m) => /timeout|timed out|etimedout/.test(m),
      cause: 'The operation did not complete within the allowed time.',
      fix: 'Increase the timeout limit or investigate slow network/database calls.',
    },
    {
      match: (m) => /cors/.test(m),
      cause: 'The browser blocked a cross-origin request due to missing CORS headers.',
      fix: 'Add the appropriate Access-Control-Allow-Origin header on the server for this origin.',
    },
  ];

  const matched = rules.find((r) => r.match(msg));

  if (matched) {
    return res.json({ cause: matched.cause, fix: matched.fix });
  }

  res.json({
    cause: 'The exact cause could not be determined from the error message alone.',
    fix: 'Review the stack trace, check recent code changes, and add logging around the failure point.',
  });
});

app.listen(PORT, () => {
  console.log(`Self-Healing Site server running on http://localhost:${PORT}`);
});
