const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const deploymentGuidePath = path.join(__dirname, '..', 'docs', 'Deployment.md');
const deploymentGuide = fs.readFileSync(deploymentGuidePath, 'utf8');

const requiredAcceptanceExpectations = [
  {
    description: 'target-tenant acceptance heading',
    pattern: /## Target-Tenant Black-Box Acceptance/,
  },
  {
    description: 'managed solution artifact retention requirement',
    pattern: /exact managed solution artifact/i,
  },
  {
    description: 'temporary Forms response seam',
    pattern: /temporary Microsoft Forms response/i,
  },
  {
    description: 'small and large concert scope coverage',
    pattern: /small and large concert scopes/i,
  },
  {
    description: 'both concert types coverage',
    pattern: /both concert types/i,
  },
  {
    description: 'labels 7 through 9 verification',
    pattern: /labels?\s+7 through 9/i,
  },
  {
    description: 'completed-with-warnings coverage',
    pattern: /completed-with-warnings/i,
  },
  {
    description: 'zero-valid-task coverage',
    pattern: /zero-valid-task/i,
  },
  {
    description: 'today and past date rejection coverage',
    pattern: /today and past date/i,
  },
  {
    description: 'structural workbook failure coverage',
    pattern: /structural workbook failure/i,
  },
  {
    description: 'runtime failure after partial creation coverage',
    pattern: /runtime failure after partial creation/i,
  },
  {
    description: 'run history evidence requirement',
    pattern: /run history/i,
  },
  {
    description: 'non-idempotent create actions do not retry requirement',
    pattern: /do not retry/i,
  },
  {
    description: 'bounded e-mail retries requirement',
    pattern: /bounded e-mail retr/i,
  },
  {
    description: 'temporary plan cleanup requirement',
    pattern: /temporary plan/i,
  },
  {
    description: 'temporary workbook cleanup requirement',
    pattern: /temporary workbook row/i,
  },
  {
    description: 'archive material protection requirement',
    pattern: /archive material/i,
  },
];

test('documents the target-tenant black-box acceptance runbook and evidence contract', () => {
  for (const expectation of requiredAcceptanceExpectations) {
    assert.match(
      deploymentGuide,
      expectation.pattern,
      `Deployment guide is missing ${expectation.description}.`,
    );
  }
});
