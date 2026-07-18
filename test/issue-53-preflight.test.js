const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(
  __dirname,
  '..',
  'src',
  'CampanulaPlannerFlows',
  'Workflows',
  'CampanulaCreateConcertPlanFromTemplate.json',
);

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const rootActions = workflow.properties.definition.actions;
const requiredWorkbookReads = [
  'ListRowsTasksTemplate',
  'ListRowsGroups',
  'ListRowsBuckets',
  'ListRowsProgress',
  'ListRowsPriority',
  'ListRowsLabels',
];

function getRootAction(actionName) {
  return rootActions[actionName];
}

function assertHasRootAction(actionName, message) {
  assert.ok(getRootAction(actionName), message);
}

test('creates the Planner plan only after a dedicated preflight success gate', () => {
  assertHasRootAction('ValidateConcertRequest', 'missing ValidateConcertRequest gate');
  assertHasRootAction('ReadWorkbookContract', 'missing ReadWorkbookContract scope');
  assertHasRootAction(
    'ValidateSharedPlanConfiguration',
    'missing shared config validation',
  );
  assertHasRootAction('NotifyPreflightFailure', 'missing preflight failure notification');

  const createPlanRunAfter = getRootAction('Create_Planner_Plan')?.runAfter ?? {};

  assert.deepEqual(createPlanRunAfter, {
    ValidateSharedPlanConfiguration: ['Succeeded'],
  });
});

test('reads every required workbook table before Planner creation', () => {
  const workbookScope = getRootAction('ReadWorkbookContract')?.actions ?? {};

  for (const actionName of requiredWorkbookReads) {
    assert.ok(workbookScope[actionName], `missing workbook read: ${actionName}`);
  }
});

test('uses a Europe/Prague date gate and pre-create failure notifications', () => {
  const validateConcertRequest = getRootAction('ValidateConcertRequest');
  const readWorkbookContract = getRootAction('ReadWorkbookContract');
  const validateSharedPlanConfiguration = getRootAction('ValidateSharedPlanConfiguration');

  assert.equal(validateConcertRequest?.type, 'If');
  assert.match(
    JSON.stringify(validateConcertRequest?.expression ?? {}),
    /Central Europe Standard Time/,
  );
  assert.ok(
    validateConcertRequest?.else?.actions?.NotifyInvalidConcertDate,
    'missing invalid-date notification',
  );
  assertHasRootAction(
    'NotifyPreflightFailure',
    'missing workbook-read failure notification',
  );
  assert.deepEqual(readWorkbookContract?.runAfter ?? {}, {
    ValidateConcertRequest: ['Succeeded'],
  });
  assert.deepEqual(validateSharedPlanConfiguration?.runAfter ?? {}, {
    ReadWorkbookContract: ['Succeeded'],
  });
});
