const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const deploymentGuidePath = path.join(__dirname, '..', 'docs', 'Deployment.md');
const deploymentGuide = fs.readFileSync(deploymentGuidePath, 'utf8');

const requiredAcceptancePatterns = [
  /## Target-Tenant Black-Box Acceptance/,
  /exact managed solution artifact/i,
  /temporary Microsoft Forms response/i,
  /small and large concert scopes/i,
  /both concert types/i,
  /labels?\s+7 through 9/i,
  /completed-with-warnings/i,
  /zero-valid-task/i,
  /today and past date/i,
  /structural workbook failure/i,
  /runtime failure after partial creation/i,
  /run history/i,
  /do not retry/i,
  /bounded e-mail retr/i,
  /temporary plan/i,
  /temporary workbook row/i,
  /archive material/i,
];

test('documents the target-tenant black-box acceptance runbook and evidence contract', () => {
  for (const pattern of requiredAcceptancePatterns) {
    assert.match(deploymentGuide, pattern);
  }
});
