const solutionNames = ['CampanulaPlannerFlows', 'CampanulaPlannerGraphConnector'];
const workflowId = '7b7d1d61-5ad2-4a81-9ee8-3e6e7c829018';
const connectorId = 'aa5c469a-b5dd-4963-917c-66bf35639bb3';
const flowDefinition = require('../src/CampanulaPlannerFlows/Workflows/CampanulaCreateConcertPlanFromTemplate.json');
const referenceNames = Object.values(flowDefinition.properties.connectionReferences)
  .map(ref => ref.connection.connectionReferenceLogicalName);
const graphReference = 'campa_sharedcampanulaplannergraph_createconcertplan';
const graphApi = 'shared_campa-5fcampanula-20planner-20graph-5f2d765a9c3b99d87d';
const graphApiId = `/providers/Microsoft.PowerApps/apis/${graphApi}`;
const guid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

async function cleanup(env, request = fetch, log = console.log) {
  const org = new URL(env.PP_ENVIRONMENT_URL);
  if (org.protocol !== 'https:' || org.href !== `${org.origin}/`) throw Error('Expected an HTTPS organization URL.');
  if (!guid.test(env.PP_TENANT_ID) || !guid.test(env.PP_APP_ID) || !env.PP_CLIENT_SECRET) {
    throw Error('Missing or invalid deployment app credentials.');
  }
  if (!['preview', 'uninstall'].includes(env.CLEANUP_MODE) || !['true', 'false'].includes(env.REMOVE_GRAPH_CONNECTION)) {
    throw Error('Select a valid cleanup mode and connection option.');
  }
  const apply = env.CLEANUP_MODE === 'uninstall';
  const removeConnection = env.REMOVE_GRAPH_CONNECTION === 'true';
  let connection;
  if (removeConnection) {
    const raw = env.PP_GRAPH_CONNECTION_ID || '';
    connection = graphConnectionName(raw);
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(connection)) throw Error('Expected the exact Graph connection name in PP_GRAPH_CONNECTION_ID.');
  }
  const confirmation = `UNINSTALL ${org.hostname}${removeConnection ? ` AND ${connection}` : ''}`;
  if (apply && env.CLEANUP_CONFIRMATION !== confirmation) throw Error('Confirmation does not match. Run preview with the same options first.');
  log(`Target: ${org.origin}. Order: ${solutionNames.join(' then ')}. Graph connection: ${connection || 'no explicit deletion'}.`);

  async function token(scope) {
    const response = await request(`https://login.microsoftonline.com/${env.PP_TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST', redirect: 'error',
      body: new URLSearchParams({ client_id: env.PP_APP_ID, client_secret: env.PP_CLIENT_SECRET,
        grant_type: 'client_credentials', scope: `${scope}/.default` }),
    });
    if (!response.ok) throw Error(`Authentication for ${scope} failed (HTTP ${response.status}).`);
    const result = await response.json();
    if (!result.access_token) throw Error(`Missing token for ${scope}.`);
    return result.access_token;
  }
  async function api(url, bearer, method = 'GET') {
    if (method === 'DELETE' && !apply) throw Error('Preview cannot delete.');
    const response = await request(url, { method, redirect: 'error',
      headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json', 'Cache-Control': 'no-cache' } });
    if (!response.ok) {
      throw Error(`${method} ${new URL(url).pathname} failed (HTTP ${response.status}). Check dependencies and the caller's permissions; do not broaden access to force cleanup.`);
    }
    if (method === 'GET') return response.json();
  }

  const dvToken = await token(org.origin);
  const dv = (path, method) => api(`${org.origin}/api/data/v9.2/${path}`, dvToken, method);
  async function components(table, select, filter) {
    const { value, '@odata.nextLink': more } = await dv(`${table}?$select=${select}&$filter=${encodeURIComponent(filter)}`);
    if (!Array.isArray(value) || more) throw Error(`Incomplete ${table} inventory. Stop and inspect the target environment.`);
    return value;
  }
  const readFlows = () => components('workflows', 'statecode', `workflowid eq ${workflowId}`);
  const readReferences = () => components('connectionreferences', 'connectionreferencelogicalname',
    referenceNames.map(name => `connectionreferencelogicalname eq '${name}'`).join(' or '));
  const readConnectors = () => components('connectors', 'connectorid', `connectorid eq ${connectorId}`);
  async function solution(name) {
    const { value } = await dv(`solutions?$select=solutionid,uniquename,ismanaged,version&$filter=uniquename eq '${name}'&$top=2`);
    if (!Array.isArray(value) || value.length > 1 || (value.length && (
      value[0].uniquename !== name || value[0].ismanaged !== true || !guid.test(value[0].solutionid)
    ))) throw Error(`Expected only a managed solution with unique name ${name}.`);
    return value[0];
  }
  async function checkReferences(allowProjectReference) {
    const { value, '@odata.nextLink': more } = await dv(`connectionreferences?$select=connectionreferencelogicalname,connectionid&$filter=connectorid eq '${graphApiId}'`);
    if (more || !Array.isArray(value) || value.some(ref => !allowProjectReference || ref.connectionreferencelogicalname !== graphReference)) {
      throw Error('Other Graph connection references remain. Inspect their consumers before removing the connector.');
    }
    if (value.length) {
      const bound = value[0].connectionid;
      log(`Installed Graph reference points to ${bound || '(unbound)'}.`);
      if (removeConnection && bound && graphConnectionName(bound) !== connection) {
        log('The installed binding differs from PP_GRAPH_CONNECTION_ID. Review ownership and usage of both connections.');
        if (apply) throw Error('Refusing optional connection deletion with a mismatched binding. Use solutions-only cleanup first.');
      }
    }
  }

  const installed = [];
  for (const name of solutionNames) {
    const record = await solution(name);
    log(`${name}: ${record ? `managed ${record.version} (${record.solutionid})` : 'not installed'}.`);
    if (record) installed.push(record);
  }
  await checkReferences(installed.some(s => s.uniquename === solutionNames[0]));
  const flows = await readFlows();
  const references = await readReferences();
  const connectors = await readConnectors();
  log(`Dataverse components: ${flows.length} flow, ${connectors.length} custom connector, ${references.length} project connection references.`);
  for (const ref of references) log(`  ${ref.connectionreferencelogicalname}`);
  if (flows.some(record => record.statecode !== 0)) {
    log('Turn off the Campanula flow and let active runs finish before uninstalling.');
    if (apply) throw Error('Flow is not off. No solutions have been removed.');
  }

  let findConnection, deleteConnection;
  if (removeConnection) {
    const { Detail } = await dv("RetrieveCurrentOrganization(AccessType=Microsoft.Dynamics.CRM.EndpointAccessType'Default')");
    if (!guid.test(Detail.EnvironmentId?.replace(/^Default-/i, ''))) throw Error('Cannot identify the target Power Apps environment.');
    const base = `https://api.powerapps.com/providers/Microsoft.PowerApps/scopes/admin/environments/${Detail.EnvironmentId}`;
    const ppToken = await token('https://service.powerapps.com');
    // Same environment-scoped routes as Get-/Remove-AdminPowerAppConnection.
    findConnection = async () => {
      const { value, nextLink, '@odata.nextLink': more } = await api(`${base}/connections?api-version=2016-11-01`, ppToken);
      if (!Array.isArray(value) || nextLink || more) throw Error('Incomplete connection inventory. Check the exact connection manually.');
      const matches = value.filter(row => row.name === connection);
      if (matches.length > 1 || matches.some(row => row.properties?.apiId?.toLowerCase() !== graphApiId.toLowerCase() ||
        row.properties?.environment?.name?.toLowerCase() !== Detail.EnvironmentId.toLowerCase())) {
        throw Error('Configured connection does not uniquely identify a connection on the Campanula Graph connector.');
      }
      return matches.length === 1;
    };
    deleteConnection = () => api(`${base}/apis/${graphApi}/connections/${connection}?api-version=2017-06-01`, ppToken, 'DELETE');
  }
  const found = removeConnection && await findConnection();
  if (removeConnection) log(`Configured Graph connection: ${found ? 'present' : 'not listed in target environment'}.`);
  if (!apply) {
    log(`Preview only. After checking backups and consumers, confirm with: ${confirmation}`);
    return;
  }

  async function uninstall(name) {
    const record = installed.find(item => item.uniquename === name);
    if (!record) return;
    log(`Uninstalling ${record.uniquename}.`);
    await dv(`solutions(${record.solutionid})`, 'DELETE');
    if (await solution(record.uniquename)) throw Error(`Could not verify removal of ${record.uniquename}. Stop and inspect solution history.`);
    log(`Verified removal of ${record.uniquename}.`);
  }
  await uninstall(solutionNames[0]);
  const remaining = (await readReferences()).map(ref => ref.connectionreferencelogicalname);
  if ((await readFlows()).length) remaining.unshift(`workflow ${workflowId}`);
  if (remaining.length) throw Error(`Flow solution components remain: ${remaining.join(', ')}. Inspect solution layers and dependencies before continuing.`);
  await checkReferences(false);
  if (found && await findConnection()) {
    log(`Deleting Graph connection ${connection}.`);
    await deleteConnection();
    if (await findConnection()) throw Error('Could not verify connection removal. Ask its owner to inspect it in Power Apps.');
    log('Verified Graph connection removal.');
  }
  await uninstall(solutionNames[1]);
  if ((await readConnectors()).length) throw Error(`Custom connector ${connectorId} remains. Inspect its solution layers and dependencies.`);
  log('Verified both managed solutions, the cloud flow, its connection references, and the custom connector are absent.');
}

function graphConnectionName(raw) {
  const prefix = [`${graphApi}/`, `${graphApiId}/connections/`].find(p => raw.startsWith(p));
  return prefix ? raw.slice(prefix.length) : raw;
}

module.exports = { cleanup };
if (require.main === module) {
  cleanup(process.env).catch(error => { console.error(error.message); process.exitCode = 1; });
}
