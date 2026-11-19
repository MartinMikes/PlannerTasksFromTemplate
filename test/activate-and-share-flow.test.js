const test = require('node:test');
const assert = require('node:assert/strict');
const { activateAndShare } = require('../scripts/activate-and-share-flow');

const flowId = '00000000-0000-0000-0000-000000000001';
const objectId = '00000000-0000-0000-0000-000000000002';
const principalId = '00000000-0000-0000-0000-000000000003';
const env = {
  PP_ENVIRONMENT_URL: 'https://org.example.test', PP_TENANT_ID: flowId, PP_APP_ID: objectId,
  PP_CLIENT_SECRET: 'test', FLOW_SOLUTION_WORKFLOW_ID: flowId,
  FLOW_SHARE_PRINCIPAL_TYPE: 'Group', FLOW_SHARE_PRINCIPAL_OBJECT_ID: objectId, FLOW_SHARE_ROLE: 'CanView',
};
const draft = { category: 5, type: 1, statecode: 0 };
const active = { ...draft, statecode: 1 };
const team = { value: [{ teamid: principalId }] };
const empty = { PrincipalAccesses: [] };
function shared(type, mask) {
  return { PrincipalAccesses: [{ Principal: { '@odata.type': `#Microsoft.Dynamics.CRM.${type}`, ownerid: principalId }, AccessMask: mask }] };
}

function scenario(responses, config = env) {
  const calls = [];
  const run = () => activateAndShare(config, async (url, options) => {
    calls.push({ url: new URL(url), ...options });
    if (new URL(url).hostname === 'login.microsoftonline.com') return Response.json({ access_token: 'mock' });
    assert.ok(responses.length, `Unexpected ${options.method} ${url}`);
    const body = responses.shift();
    if (body instanceof Response) return body;
    return body === null ? new Response(null, { status: 204 }) : Response.json(body);
  });
  return { calls, run };
}

test('activates the solution ID despite localization and grants only the resolved team read access', async () => {
  const { run, calls } = scenario([
    { ...draft, name: 'Localized display name' }, team, empty, null, active, null, shared('team', 'ReadAccess'),
  ]);
  await run();
  const workflow = `/api/data/v9.2/workflows(${flowId})`;
  assert.equal(calls[1].url.pathname, workflow);
  assert.equal(calls[2].url.searchParams.get('$filter'), `azureactivedirectoryobjectid eq ${objectId}`);
  const patch = calls.find(call => call.method === 'PATCH');
  assert.equal(patch.url.pathname, workflow);
  assert.deepEqual(JSON.parse(patch.body), { statecode: 1 });
  const grant = calls.find(call => call.url.pathname.endsWith('/GrantAccess'));
  assert.deepEqual(JSON.parse(grant.body), {
    Target: { '@odata.type': 'Microsoft.Dynamics.CRM.workflow', workflowid: flowId },
    PrincipalAccess: { Principal: { '@odata.type': 'Microsoft.Dynamics.CRM.team', teamid: principalId }, AccessMask: 'ReadAccess' },
  });
});

test('modifies an existing user share, then performs no writes on redeployment', async () => {
  const user = { value: [{ systemuserid: principalId }] };
  const config = { ...env, FLOW_SHARE_PRINCIPAL_TYPE: 'User', FLOW_SHARE_ROLE: 'CanEdit' };
  const correct = shared('systemuser', 'WriteAccess, ReadAccess');
  const change = scenario([active, user, shared('systemuser', 'ReadAccess'), active, null, correct], config);
  await change.run();
  const modify = change.calls.find(call => call.url.pathname.endsWith('/ModifyAccess'));
  assert.equal(JSON.parse(modify.body).PrincipalAccess.AccessMask, 'ReadAccess, WriteAccess');
  const repeat = scenario([active, user, correct, active, correct], config);
  await repeat.run();
  assert.ok(repeat.calls.slice(1).every(call => call.method === 'GET'));
});

test('fails before mutation on ambiguous principals and fails closed on unverified writes', async () => {
  const ambiguous = scenario([draft, { value: [...team.value, ...team.value] }]);
  await assert.rejects(ambiguous.run, /Expected one Dataverse team/);
  assert.ok(ambiguous.calls.slice(1).every(call => call.method === 'GET'));
  await assert.rejects(scenario([draft, team, empty, null, draft]).run, /not active/);
  await assert.rejects(scenario([active, team, empty, active, null, empty]).run, /Could not verify/);
});

test('reports activation rejection and never shares an invalid flow', async () => {
  const error = Response.json({ error: { message: 'WorkflowOperationParametersExtraParameter: body/orderHint' } }, { status: 400 });
  const attempt = scenario([draft, team, empty, error]);
  await assert.rejects(attempt.run, /Dataverse PATCH .*HTTP 400.*WorkflowOperationParametersExtraParameter/);
  assert.equal(attempt.calls.at(-1).method, 'PATCH');
});
