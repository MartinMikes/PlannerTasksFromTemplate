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
const connectorPath = path.join(
  __dirname,
  '..',
  'src',
  'CampanulaPlannerFlows',
  'Connectors',
  'campa_planner_graph_openapidefinition.json',
);
const connector = JSON.parse(fs.readFileSync(connectorPath, 'utf8'));

function getRootAction(actionName) {
  return rootActions[actionName];
}

test('configures populated Planner labels once before task creation', () => {
  const getPlanDetails = getRootAction('GetPlannerPlanDetails');
  const updatePlanDetails = getRootAction('UpdatePlannerPlanDetails');
  const tasksRead = getRootAction('List_rows_present_in_a_table_-_TasksTemplate');

  assert.equal(getPlanDetails?.inputs?.host?.operationId, 'GetPlanDetails');

  assert.equal(updatePlanDetails?.inputs?.host?.operationId, 'UpdatePlanDetails');
  assert.deepEqual(updatePlanDetails?.runAfter ?? {}, {
    GetPlannerPlanDetails: ['Succeeded'],
  });
  assert.match(
    JSON.stringify(updatePlanDetails?.inputs?.parameters ?? {}),
    /If-Match/i,
  );
  assert.match(
    JSON.stringify(updatePlanDetails?.inputs?.parameters ?? {}),
    /categoryDescriptions/,
  );

  assert.deepEqual(tasksRead?.runAfter ?? {}, {
    Apply_to_each_bucket: ['Succeeded'],
    UpdatePlannerPlanDetails: ['Succeeded'],
  });
});

test('creates every workbook bucket sequentially with the current Planner operation', () => {
  const listBuckets = getRootAction('List_rows_present_in_a_table_-_Buckets');
  const foreachBucket = getRootAction('Apply_to_each_bucket');
  const createBucket = foreachBucket?.actions?.Create_Planner_Bucket;
  const setBucketMap = foreachBucket?.actions?.Set_BucketMap;

  assert.deepEqual(listBuckets?.runAfter ?? {}, {
    Create_Planner_Plan: ['Succeeded'],
  });
  assert.equal(foreachBucket?.operationOptions, 'Sequential');
  assert.equal(
    foreachBucket?.foreach,
    "@outputs('List_rows_present_in_a_table_-_Buckets')?['body/value']",
  );
  assert.equal(createBucket?.inputs?.host?.operationId, 'CreateBucket_V2');
  assert.deepEqual(setBucketMap?.runAfter ?? {}, {
    Create_Planner_Bucket: ['Succeeded'],
  });
});

test('extends the Graph connector only with plan-details read and patch operations', () => {
  const connectorPaths = Object.keys(connector.paths).sort();

  assert.deepEqual(connectorPaths, [
    '/v1.0/planner/plans',
    '/v1.0/planner/plans/{planId}/details',
  ]);

  const planDetailsPath = connector.paths['/v1.0/planner/plans/{planId}/details'];

  assert.ok(planDetailsPath.get, 'missing plan-details GET operation');
  assert.ok(planDetailsPath.patch, 'missing plan-details PATCH operation');
  assert.equal(planDetailsPath.get.operationId, 'GetPlanDetails');
  assert.equal(planDetailsPath.patch.operationId, 'UpdatePlanDetails');
});
