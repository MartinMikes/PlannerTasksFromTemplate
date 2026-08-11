const test = require('node:test');
const assert = require('node:assert/strict');
const { getRootAction, getWorkflowAction } = require('./helpers/planner-fixtures');
const requiredWorkbookReads = [
  'ListRowsTasksTemplate',
  'ListRowsGroups',
  'ListRowsBuckets',
  'ListRowsProgress',
  'ListRowsPriority',
  'ListRowsLabels',
];
const validationScopeName = 'ValidateSelectedTaskRows';

function assertHasRootAction(actionName, message) {
  assert.ok(getRootAction(actionName), message);
}

function assertRunAfter(actionName, expectedRunAfter) {
  assert.deepEqual(getRootAction(actionName)?.runAfter ?? {}, expectedRunAfter);
}

function getSelectedRowValidationActions() {
  return getRootAction(validationScopeName)?.actions ?? {};
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

  assertRunAfter('GenerateConcertPlan', {
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
  assertRunAfter('ReadWorkbookContract', {
    ValidateConcertRequest: ['Succeeded'],
  });
  assertRunAfter('ValidateSharedPlanConfiguration', {
    ReadWorkbookContract: ['Succeeded'],
  });
  assertRunAfter(validationScopeName, {
    ValidateSharedPlanConfiguration: ['Succeeded'],
  });
});

test('classifies selected rows before plan creation and stops when none are valid', () => {
  const validateSelectedTaskRows = getRootAction(validationScopeName);
  const validationActions = getSelectedRowValidationActions();
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
  const applyToEachTemplateTask = getWorkflowAction(
    'GenerateConcertPlan',
    'Apply_to_each_template_task',
  );
  const notifyConcertPlanOutcome = getRootAction('NotifyConcertPlanOutcome');
  const classifySelectedRows =
    getSelectedRowValidationActions().ApplyToEachSelectedTemplateRow;
  const classifySelectedRowActions = classifySelectedRows?.actions ?? {};

  assert.equal(
    applyToEachTemplateTask?.foreach,
    "@variables('validSelectedRows')",
  );
  assert.ok(
    classifySelectedRowActions.ComposeSelectedTaskWarningHtml,
    'missing selected-row warning formatter',
  );
  assert.match(
    JSON.stringify(
      notifyConcertPlanOutcome?.actions?.NotifyCompletedWithWarnings?.inputs?.parameters?.[
        'emailMessage/Body'
      ] ?? '',
    ),
    /skippedSelectedRowWarnings/,
  );
});
