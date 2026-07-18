const test = require('node:test');
const assert = require('node:assert/strict');
const {
  connector,
  getRootAction,
  readActionOperationId,
  readActionParameters,
} = require('./helpers/planner-fixtures');
const plannerPlanDetailsPath = '/v1.0/planner/plans/{planId}/details';

test('configures populated Planner labels once before task creation', () => {
  const getPlanDetails = getRootAction('GetPlannerPlanDetails');
  const updatePlanDetails = getRootAction('UpdatePlannerPlanDetails');
  const createTasks = getRootAction('Apply_to_each_template_task');

  assert.equal(readActionOperationId(getPlanDetails), 'GetPlanDetails');

  assert.equal(readActionOperationId(updatePlanDetails), 'UpdatePlanDetails');
  assert.deepEqual(updatePlanDetails?.runAfter ?? {}, {
    GetPlannerPlanDetails: ['Succeeded'],
  });
  assert.match(readActionParameters(updatePlanDetails), /If-Match/i);
  assert.match(readActionParameters(updatePlanDetails), /categoryDescriptions/);

  assert.deepEqual(createTasks?.runAfter ?? {}, {
    Apply_to_each_bucket: ['Succeeded'],
    UpdatePlannerPlanDetails: ['Succeeded'],
  });
  assert.equal(createTasks?.foreach, "@variables('validSelectedRows')");
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
  assert.equal(readActionOperationId(createBucket), 'CreateBucket_V2');
  assert.deepEqual(setBucketMap?.runAfter ?? {}, {
    Create_Planner_Bucket: ['Succeeded'],
  });
});

test('extends the Graph connector only with plan-details read and patch operations', () => {
  const connectorPaths = Object.keys(connector.paths).sort();

  assert.ok(
    connectorPaths.includes('/v1.0/planner/plans'),
    'missing Planner plan create path',
  );
  assert.ok(
    connectorPaths.includes(plannerPlanDetailsPath),
    'missing Planner plan-details path',
  );

  const planDetailsPath = connector.paths[plannerPlanDetailsPath];

  assert.ok(planDetailsPath.get, 'missing plan-details GET operation');
  assert.ok(planDetailsPath.patch, 'missing plan-details PATCH operation');
  assert.equal(planDetailsPath.get.operationId, 'GetPlanDetails');
  assert.equal(planDetailsPath.patch.operationId, 'UpdatePlanDetails');
});
