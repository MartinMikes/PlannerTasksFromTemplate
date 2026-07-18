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
const taskLoopActions = rootActions.Apply_to_each_template_task?.actions ?? {};
const connectorPath = path.join(
  __dirname,
  '..',
  'src',
  'CampanulaPlannerFlows',
  'Connectors',
  'campa_planner_graph_openapidefinition.json',
);
const connector = JSON.parse(fs.readFileSync(connectorPath, 'utf8'));

function readActionOperationId(action) {
  return action?.inputs?.host?.operationId;
}

function readActionParameters(action) {
  return JSON.stringify(action?.inputs?.parameters ?? {});
}

test('updates Planner task progress and details through single-pass Graph reads and writes', () => {
  const createTask = taskLoopActions.Create_Planner_Task;
  const getTask = taskLoopActions.GetPlannerTask;
  const updateTask =
    taskLoopActions.ConditionallyUpdatePlannerTaskProgress?.actions?.UpdatePlannerTask;
  const resetTaskChecklistItems = taskLoopActions.SetTaskChecklistItemsEmpty;
  const buildTaskChecklistItems = taskLoopActions.ApplyToEachChecklistItemPayload;
  const getTaskDetails = taskLoopActions.GetPlannerTaskDetails;
  const updateTaskDetails = taskLoopActions.UpdatePlannerTaskDetails;

  assert.equal(readActionOperationId(createTask), 'CreateTask_V3');

  assert.equal(readActionOperationId(getTask), 'GetTask');
  assert.deepEqual(getTask?.runAfter ?? {}, {
    Create_Planner_Task: ['Succeeded'],
  });

  assert.equal(taskLoopActions.ConditionallyUpdatePlannerTaskProgress?.type, 'If');
  assert.deepEqual(taskLoopActions.ConditionallyUpdatePlannerTaskProgress?.runAfter ?? {}, {
    GetPlannerTask: ['Succeeded'],
  });
  assert.match(
    JSON.stringify(taskLoopActions.ConditionallyUpdatePlannerTaskProgress?.expression ?? {}),
    /In progress|Completed/,
  );

  assert.equal(readActionOperationId(updateTask), 'UpdateTask');
  assert.deepEqual(updateTask?.runAfter ?? {}, {});
  assert.match(readActionParameters(updateTask), /If-Match/i);
  assert.match(readActionParameters(updateTask), /percentComplete/);
  assert.equal(taskLoopActions.ConditionallyUpdatePlannerTaskProgress?.actions?.UpdatePlannerTask, updateTask);

  assert.deepEqual(resetTaskChecklistItems?.runAfter ?? {}, {
    ConditionallyUpdatePlannerTaskProgress: ['Succeeded', 'Skipped'],
  });

  assert.equal(buildTaskChecklistItems?.type, 'Foreach');
  assert.deepEqual(buildTaskChecklistItems?.runAfter ?? {}, {
    SetTaskChecklistItemsEmpty: ['Succeeded'],
  });

  assert.equal(readActionOperationId(getTaskDetails), 'GetTaskDetails');
  assert.deepEqual(getTaskDetails?.runAfter ?? {}, {
    ApplyToEachChecklistItemPayload: ['Succeeded'],
  });

  assert.equal(readActionOperationId(updateTaskDetails), 'UpdateTaskDetails');
  assert.deepEqual(updateTaskDetails?.runAfter ?? {}, {
    GetPlannerTaskDetails: ['Succeeded'],
  });
  assert.match(readActionParameters(updateTaskDetails), /If-Match/i);
  assert.match(readActionParameters(updateTaskDetails), /description/);
  assert.match(readActionParameters(updateTaskDetails), /checklist/);

  assert.equal(taskLoopActions.Update_Planner_Task_Details, undefined);
  assert.equal(taskLoopActions.Apply_to_each_checklist_item, undefined);
});

test('extends the Graph connector only with documented task and task-details operations', () => {
  const connectorPaths = Object.keys(connector.paths).sort();

  assert.deepEqual(connectorPaths, [
    '/v1.0/planner/plans',
    '/v1.0/planner/plans/{planId}/details',
    '/v1.0/planner/tasks/{id}',
    '/v1.0/planner/tasks/{id}/details',
  ]);

  const taskPath = connector.paths['/v1.0/planner/tasks/{id}'];
  const taskDetailsPath = connector.paths['/v1.0/planner/tasks/{id}/details'];

  assert.ok(taskPath.get, 'missing task GET operation');
  assert.ok(taskPath.patch, 'missing task PATCH operation');
  assert.equal(taskPath.get.operationId, 'GetTask');
  assert.equal(taskPath.patch.operationId, 'UpdateTask');

  assert.ok(taskDetailsPath.get, 'missing task-details GET operation');
  assert.ok(taskDetailsPath.patch, 'missing task-details PATCH operation');
  assert.equal(taskDetailsPath.get.operationId, 'GetTaskDetails');
  assert.equal(taskDetailsPath.patch.operationId, 'UpdateTaskDetails');
});
