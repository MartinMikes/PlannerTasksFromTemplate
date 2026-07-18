const test = require('node:test');
const assert = require('node:assert/strict');
const { getRootAction, readActionOperationId } = require('./helpers/planner-fixtures');

function readRetryPolicyType(action) {
  return action?.inputs?.retryPolicy?.type;
}

test('handles generation with three operator-visible outcomes and create-only retry suppression', () => {
  const generateConcertPlan = getRootAction('GenerateConcertPlan');
  const notifyConcertPlanOutcome = getRootAction('NotifyConcertPlanOutcome');
  const notifyGenerationFailure = getRootAction('NotifyGenerationFailure');
  const terminateGenerationFailure = getRootAction('TerminateGenerationFailure');
  const generateActions = generateConcertPlan?.actions ?? {};

  assert.equal(generateConcertPlan?.type, 'Scope');
  assert.deepEqual(generateConcertPlan?.runAfter ?? {}, {
    ValidateSelectedTaskRows: ['Succeeded'],
  });

  assert.equal(notifyConcertPlanOutcome?.type, 'If');
  assert.deepEqual(notifyConcertPlanOutcome?.runAfter ?? {}, {
    GenerateConcertPlan: ['Succeeded'],
  });
  assert.match(
    JSON.stringify(notifyConcertPlanOutcome?.expression ?? {}),
    /skippedSelectedRowWarnings/,
  );
  assert.ok(
    notifyConcertPlanOutcome?.actions?.NotifyCompletedWithWarnings,
    'missing completed-with-warnings notification',
  );
  assert.ok(
    notifyConcertPlanOutcome?.else?.actions?.NotifyCleanSuccess,
    'missing clean-success notification',
  );

  const warningsBody =
    notifyConcertPlanOutcome?.actions?.NotifyCompletedWithWarnings?.inputs?.parameters?.[
      'emailMessage/Body'
    ] ?? '';
  const successBody =
    notifyConcertPlanOutcome?.else?.actions?.NotifyCleanSuccess?.inputs?.parameters?.[
      'emailMessage/Body'
    ] ?? '';

  assert.match(warningsBody, /plannerPlanLink/i);
  assert.match(warningsBody, /createdTaskCount/i);
  assert.match(warningsBody, /skippedSelectedRowWarnings/i);
  assert.match(successBody, /plannerPlanLink/i);
  assert.match(successBody, /createdTaskCount/i);
  assert.doesNotMatch(successBody, /skippedSelectedRowWarnings/i);

  assert.equal(readActionOperationId(notifyGenerationFailure), 'SendEmailV2');
  assert.deepEqual(notifyGenerationFailure?.runAfter ?? {}, {
    GenerateConcertPlan: ['Failed', 'TimedOut'],
  });
  assert.match(
    notifyGenerationFailure?.inputs?.parameters?.['emailMessage/Body'] ?? '',
    /generationStage/i,
  );
  assert.match(
    notifyGenerationFailure?.inputs?.parameters?.['emailMessage/Body'] ?? '',
    /plannerPlanLink/i,
  );
  assert.match(
    notifyGenerationFailure?.inputs?.parameters?.['emailMessage/Body'] ?? '',
    /delete.*partial/i,
  );
  assert.match(
    notifyGenerationFailure?.inputs?.parameters?.['emailMessage/Body'] ?? '',
    /submit a new Form response/i,
  );

  assert.equal(terminateGenerationFailure?.type, 'Terminate');
  assert.deepEqual(terminateGenerationFailure?.runAfter ?? {}, {
    NotifyGenerationFailure: ['Succeeded', 'Failed', 'TimedOut'],
  });

  assert.equal(readRetryPolicyType(generateActions.Create_Planner_Plan), 'none');
  assert.equal(
    readRetryPolicyType(generateActions.Apply_to_each_bucket?.actions?.Create_Planner_Bucket),
    'none',
  );
  assert.equal(
    readRetryPolicyType(generateActions.Apply_to_each_template_task?.actions?.Create_Planner_Task),
    'none',
  );

  assert.notEqual(
    readRetryPolicyType(notifyConcertPlanOutcome?.actions?.NotifyCompletedWithWarnings),
    'none',
  );
  assert.notEqual(
    readRetryPolicyType(notifyConcertPlanOutcome?.else?.actions?.NotifyCleanSuccess),
    'none',
  );
  assert.notEqual(readRetryPolicyType(notifyGenerationFailure), 'none');
});
