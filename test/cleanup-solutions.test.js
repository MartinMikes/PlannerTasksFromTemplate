const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanup } = require('../scripts/cleanup-solutions');

const flowId = '00000000-0000-0000-0000-000000000001';
const connectorId = '00000000-0000-0000-0000-000000000002';
const environment = `Default-${flowId}`;
const graphApi = 'shared_campa-5fcampanula-20planner-20graph-5f2d765a9c3b99d87d';
const connection = '0123456789abcdef0123456789abcdef';
const org = 'cleanup.example.org';
const flowPath = `/api/data/v9.2/solutions(${flowId})`;
const connectorPath = `/api/data/v9.2/solutions(${connectorId})`;
const connectionPath = `/providers/Microsoft.PowerApps/scopes/admin/environments/${environment}/apis/${graphApi}/connections/${connection}`;

function fixture(options = {}) {
  const records = new Map([
    ['CampanulaPlannerFlows', flowId],
    ['CampanulaPlannerGraphConnector', connectorId],
  ]);
  if (options.alreadyUninstalled) records.clear();
  let hasConnection = true;
  const deletes = [];
  const messages = [];
  const env = {
    PP_ENVIRONMENT_URL: `https://${org}`, PP_APP_ID: flowId, PP_TENANT_ID: connectorId,
    PP_CLIENT_SECRET: 'mock', PP_GRAPH_CONNECTION_ID: `${graphApi}/${connection}`,
    CLEANUP_MODE: 'uninstall', REMOVE_GRAPH_CONNECTION: 'true',
    CLEANUP_CONFIRMATION: `UNINSTALL ${org} AND ${connection}`,
  };
  async function mock(input, { method }) {
    const url = new URL(input);
    if (method === 'POST' && url.hostname === 'login.microsoftonline.com') return Response.json({ access_token: 'mock' });
    if (method === 'DELETE') {
      deletes.push(url.pathname);
      if (url.pathname === flowPath) {
        if (options.dependency) return new Response(null, { status: 409 });
        records.delete('CampanulaPlannerFlows');
      } else if (url.pathname === connectorPath) records.delete('CampanulaPlannerGraphConnector');
      else if (url.pathname === connectionPath) hasConnection = false;
      else assert.fail(`Unexpected deletion: ${url.pathname}`);
      return new Response(null, { status: 204 });
    }
    assert.equal(method, 'GET');
    if (url.pathname.endsWith('/solutions')) {
      const name = url.searchParams.get('$filter').match(/^uniquename eq '([^']+)'$/)[1];
      return Response.json({ value: records.has(name) ? [{
        uniquename: name, solutionid: records.get(name), ismanaged: !options.unmanaged, version: '1.0',
      }] : [] });
    }
    if (url.pathname.endsWith('/connectionreferences')) {
      if (url.searchParams.get('$filter').startsWith('connectionreferencelogicalname eq')) {
        const logicalName = 'campa_sharedexcelonlinebusiness_createconcertplan';
        assert.ok(url.searchParams.get('$filter').includes(`connectionreferencelogicalname eq '${logicalName}'`));
        return Response.json({ value: records.has('CampanulaPlannerFlows') || options.remaining === 'reference'
          ? [{ connectionreferencelogicalname: logicalName }] : [] });
      }
      const value = records.has('CampanulaPlannerFlows') ? [{
        connectionreferencelogicalname: 'campa_sharedcampanulaplannergraph_createconcertplan',
        connectionid: options.staleBinding ? 'old-connection' : connection,
      }] : [];
      if (options.other) value.push({ connectionreferencelogicalname: 'another_flow' });
      return Response.json({ value });
    }
    if (url.pathname.endsWith('/workflows')) return Response.json({ value: records.has('CampanulaPlannerFlows') || options.remaining === 'workflow'
      ? [{ statecode: options.active ? 1 : 0 }] : [] });
    if (url.pathname.endsWith('/connectors')) return Response.json({ value: records.has('CampanulaPlannerGraphConnector') || options.remaining === 'connector'
      ? [{ connectorid: 'aa5c469a-b5dd-4963-917c-66bf35639bb3' }] : [] });
    if (url.pathname.includes('RetrieveCurrentOrganization')) return Response.json({ Detail: { EnvironmentId: environment } });
    if (url.pathname.endsWith(`/${environment}/connections`)) {
      if (options.forbidden) return new Response(null, { status: 403 });
      return Response.json({ value: hasConnection ? [{ name: connection, properties: {
        apiId: `/providers/Microsoft.PowerApps/apis/${options.wrongApi ? 'shared_planner' : graphApi}`,
        environment: { name: environment },
      } }] : [] });
    }
    assert.fail(`Unexpected request: ${url}`);
  }
  return { run: overrides => cleanup({ ...env, ...overrides }, mock, line => messages.push(line)), deletes, messages };
}

test('preview inventories both solutions and the optional connection without deleting anything', async () => {
  const { run, deletes, messages } = fixture();
  await run({ CLEANUP_MODE: 'preview', CLEANUP_CONFIRMATION: '' });
  assert.deepEqual(deletes, []);
  assert.ok(messages.some(text => text.includes(`UNINSTALL ${org} AND ${connection}`)));
});

test('removes the flow, opted-in connection, then connector, and is repeatable', async () => {
  const { run, deletes } = fixture();
  await run();
  await run();
  assert.deepEqual(deletes, [flowPath, connectionPath, connectorPath]);
});

test('does not report a clean install target if a component survives solution removal', async () => {
  for (const [remaining, message] of [
    ['reference', /campa_sharedexcelonlinebusiness_createconcertplan/],
    ['workflow', /workflow 7b7d1d61/],
    ['connector', /Custom connector .* remains/],
  ]) {
    const { run, deletes } = fixture({ remaining });
    await assert.rejects(run(), message);
    assert.deepEqual(deletes, remaining === 'connector' ? [flowPath, connectionPath, connectorPath] : [flowPath]);
  }
  const { run, deletes } = fixture({ alreadyUninstalled: true, remaining: 'reference' });
  await assert.rejects(run(), /campa_sharedexcelonlinebusiness_createconcertplan/);
  assert.deepEqual(deletes, []);
});

test('solutions-only cleanup needs neither a Graph connection ID nor admin connection access', async () => {
  const { run, deletes } = fixture({ forbidden: true });
  await run({ REMOVE_GRAPH_CONNECTION: 'false', PP_GRAPH_CONNECTION_ID: '', CLEANUP_CONFIRMATION: `UNINSTALL ${org}` });
  assert.deepEqual(deletes, [flowPath, connectorPath]);
});

test('rejects unsafe or unverified targets before uninstalling either solution', async () => {
  for (const [options, inputs, error] of [
    [{}, { CLEANUP_CONFIRMATION: `UNINSTALL ${org}` }, /Confirmation/],
    [{ active: true }, {}, /not off/],
    [{ unmanaged: true }, {}, /managed solution/],
    [{ other: true }, {}, /Other Graph/],
    [{ staleBinding: true }, {}, /mismatched binding/],
    [{ wrongApi: true }, {}, /does not uniquely identify/],
    [{ forbidden: true }, {}, /HTTP 403/],
  ]) {
    const { run, deletes } = fixture(options);
    await assert.rejects(run(inputs), error);
    assert.deepEqual(deletes, []);
  }
});

test('a dependency failure stops cleanup before deleting the connector or connection', async () => {
  const { run, deletes } = fixture({ dependency: true });
  await assert.rejects(run(), /HTTP 409/);
  assert.deepEqual(deletes, [flowPath]);
});
