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
  assertHasRootAction(
    'ValidateSelectedTaskRows',
    'missing selected task-row validation scope',
  );
  assertHasRootAction('NotifyPreflightFailure', 'missing preflight failure notification');

  const createPlanRunAfter = getRootAction('Create_Planner_Plan')?.runAfter ?? {};

  assert.deepEqual(createPlanRunAfter, {
    ValidateSelectedTaskRows: ['Succeeded'],
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
  const validateSelectedTaskRows = getRootAction('ValidateSelectedTaskRows');

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
  assert.deepEqual(validateSelectedTaskRows?.runAfter ?? {}, {
    ValidateSharedPlanConfiguration: ['Succeeded'],
  });
});

test('classifies selected rows before plan creation and stops when none are valid', () => {
  const validateSelectedTaskRows = getRootAction('ValidateSelectedTaskRows');
  const validationActions = validateSelectedTaskRows?.actions ?? {};
  const filterSelectedRows = validationActions.FilterSelectedTemplateRows;
  const classifySelectedRows = validationActions.ApplyToEachSelectedTemplateRow;
  const ensureValidRows = validationActions.EnsureValidSelectedTasks;

  assert.equal(validateSelectedTaskRows?.type, 'Scope');
  assert.ok(filterSelectedRows, 'missing selected-row filter');
  assert.ok(classifySelectedRows, 'missing selected-row classification loop');
  assert.ok(ensureValidRows, 'missing valid-row gate');
  assert.match(
    JSON.stringify(filterSelectedRows?.inputs?.where ?? ''),
    /templateTypeFilters/,
  );
  assert.doesNotMatch(
    JSON.stringify(filterSelectedRows?.inputs?.where ?? ''),
    /TaskName/,
  );
  assert.equal(
    classifySelectedRows?.foreach,
    "@body('FilterSelectedTemplateRows')",
  );
  assert.ok(
    ensureValidRows?.else?.actions?.NotifyNoValidSelectedTasks,
    'missing zero-valid notification',
  );
  assert.ok(
    ensureValidRows?.else?.actions?.TerminateNoValidSelectedTasks,
    'missing zero-valid termination',
  );
});

test('creates tasks only from validated rows and reports skipped selected rows', () => {
  const applyToEachTemplateTask = getRootAction('Apply_to_each_template_task');
  const sendSummaryNotification = getRootAction('Send_summary_notification');

  assert.equal(
    applyToEachTemplateTask?.foreach,
    "@variables('validSelectedRows')",
  );
  assert.match(
    JSON.stringify(sendSummaryNotification?.inputs?.parameters?.['emailMessage/Body'] ?? ''),
    /skippedSelectedRowWarnings/,
  );
});
