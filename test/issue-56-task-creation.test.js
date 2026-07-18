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
const validationActions =
  rootActions.ValidateSelectedTaskRows?.actions?.ApplyToEachSelectedTemplateRow?.actions ?? {};
const createTaskAction =
  rootActions.Apply_to_each_template_task?.actions?.Create_Planner_Task;

function readActionParameters(action) {
  return JSON.stringify(action?.inputs?.parameters ?? {});
}

test('normalizes selected-row ownership and label flags before sequential task creation', () => {
  assert.ok(
    validationActions.FilterSelectedTaskAssigneeTokens,
    'missing assignee-token normalization',
  );
  assert.ok(
    validationActions.ComposeSelectedTaskUniqueAssigneeTokens,
    'missing unique assignee-token composition',
  );
  assert.ok(
    validationActions.FilterResolvedSelectedTaskLabelRows,
    'missing label resolution against tbLabels',
  );

  assert.match(
    validationActions.ComposeSelectedTaskValidationReason?.inputs ?? '',
    /1-20 unique assignee/i,
  );
  assert.match(
    validationActions.ComposeSelectedTaskValidationReason?.inputs ?? '',
    /Labels/i,
  );

  assert.match(
    JSON.stringify(validationActions.IsSelectedTaskRowValid?.actions?.AppendValidSelectedRow?.inputs?.value ?? {}),
    /AssignedToEmails/,
  );
  assert.match(
    JSON.stringify(validationActions.IsSelectedTaskRowValid?.actions?.AppendValidSelectedRow?.inputs?.value ?? {}),
    /category1/i,
  );
  assert.match(
    JSON.stringify(validationActions.IsSelectedTaskRowValid?.actions?.AppendValidSelectedRow?.inputs?.value ?? {}),
    /category25/i,
  );

  assert.equal(createTaskAction?.inputs?.host?.operationId, 'CreateTask_V3');
  assert.match(readActionParameters(createTaskAction), /body\/assignments/);
  assert.match(readActionParameters(createTaskAction), /body\/category1/);
  assert.match(readActionParameters(createTaskAction), /body\/category25/);
  assert.match(
    readActionParameters(createTaskAction),
    /item\(\)\?\['AssignedToEmails'\]/,
  );
});
