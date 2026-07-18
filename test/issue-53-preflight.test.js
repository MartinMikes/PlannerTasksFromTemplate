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
const actions = workflow.properties.definition.actions;

test('creates the Planner plan only after a dedicated preflight success gate', () => {
  assert.ok(actions.ValidateConcertRequest, 'missing ValidateConcertRequest gate');
  assert.ok(actions.ReadWorkbookContract, 'missing ReadWorkbookContract scope');
  assert.ok(actions.ValidateSharedPlanConfiguration, 'missing shared config validation');
  assert.ok(actions.NotifyPreflightFailure, 'missing preflight failure notification');

  const createPlanRunAfter = actions.Create_Planner_Plan?.runAfter ?? {};

  assert.deepEqual(createPlanRunAfter, {
    ValidateSharedPlanConfiguration: ['Succeeded'],
  });
});

test('reads every required workbook table before Planner creation', () => {
  const workbookScope = actions.ReadWorkbookContract?.actions ?? {};

  assert.ok(workbookScope.ListRowsTasksTemplate, 'missing task table read');
  assert.ok(workbookScope.ListRowsGroups, 'missing groups table read');
  assert.ok(workbookScope.ListRowsBuckets, 'missing buckets table read');
  assert.ok(workbookScope.ListRowsProgress, 'missing progress table read');
  assert.ok(workbookScope.ListRowsPriority, 'missing priority table read');
  assert.ok(workbookScope.ListRowsLabels, 'missing labels table read');
});

test('uses a Europe/Prague date gate and pre-create failure notifications', () => {
  const validateConcertRequest = actions.ValidateConcertRequest;
  const readWorkbookContract = actions.ReadWorkbookContract;
  const validateSharedPlanConfiguration = actions.ValidateSharedPlanConfiguration;

  assert.equal(validateConcertRequest?.type, 'If');
  assert.match(
    JSON.stringify(validateConcertRequest?.expression ?? {}),
    /Central Europe Standard Time/,
  );
  assert.ok(
    validateConcertRequest?.else?.actions?.NotifyInvalidConcertDate,
    'missing invalid-date notification',
  );
  assert.ok(actions.NotifyPreflightFailure, 'missing workbook-read failure notification');
  assert.deepEqual(readWorkbookContract?.runAfter ?? {}, {
    ValidateConcertRequest: ['Succeeded'],
  });
  assert.deepEqual(validateSharedPlanConfiguration?.runAfter ?? {}, {
    ReadWorkbookContract: ['Succeeded'],
  });
});
