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
const appendValidSelectedRowValue =
  validationActions.IsSelectedTaskRowValid?.actions?.AppendValidSelectedRow?.inputs?.value ?? {};
const createTaskParameters = createTaskAction?.inputs?.parameters ?? {};

function readActionInput(actionName) {
  return validationActions[actionName]?.inputs ?? '';
}

function assertObjectContainsKey(objectValue, key, message) {
  assert.match(JSON.stringify(objectValue), new RegExp(`"${key}"`, 'i'), message);
}

function assertParameterMapsToItem(parameterName, itemKey) {
  assert.equal(
    createTaskParameters[parameterName],
    `@item()?['${itemKey}']`,
    `expected ${parameterName} to map from ${itemKey}`,
  );
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

  const validationReasonInput = readActionInput('ComposeSelectedTaskValidationReason');

  assert.match(validationReasonInput, /1-20 unique assignee/i);
  assert.match(validationReasonInput, /Labels/i);

  assert.equal(
    appendValidSelectedRowValue.AssignedToEmails,
    "@outputs('ComposeSelectedTaskNormalizedAssignedToEmails')",
  );

  for (let index = 1; index <= 25; index += 1) {
    assertObjectContainsKey(
      appendValidSelectedRowValue,
      `category${index}`,
      `missing category${index} label flag on validated rows`,
    );
  }

  assert.equal(createTaskAction?.inputs?.host?.operationId, 'CreateTask_V3');
  assert.equal(
    createTaskParameters['body/assignments'],
    "@item()?['AssignedToEmails']",
  );

  for (let index = 1; index <= 25; index += 1) {
    assertParameterMapsToItem(`body/category${index}`, `category${index}`);
  }
});
