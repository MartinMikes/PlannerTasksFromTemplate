const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function activateAndShare(env, request = fetch) {
  for (const key of ['PP_TENANT_ID', 'PP_APP_ID', 'FLOW_SOLUTION_WORKFLOW_ID', 'FLOW_SHARE_PRINCIPAL_OBJECT_ID']) {
    if (!guidPattern.test(env[key])) throw new Error(`${key} must be a GUID.`);
  }
  if (!env.PP_CLIENT_SECRET) throw new Error('PP_CLIENT_SECRET is required.');
  const org = new URL(env.PP_ENVIRONMENT_URL);
  if (org.protocol !== 'https:' || org.href !== `${org.origin}/`) {
    throw new Error('PP_ENVIRONMENT_URL must be an HTTPS organization URL.');
  }
  const group = env.FLOW_SHARE_PRINCIPAL_TYPE === 'Group';
  if (!group && env.FLOW_SHARE_PRINCIPAL_TYPE !== 'User') throw new Error('Expected a Group or User.');
  const role = env.FLOW_SHARE_ROLE;
  if (!['CanView', 'CanEdit'].includes(role)) throw new Error('Expected CanView or CanEdit.');
  const rights = role === 'CanEdit' ? ['ReadAccess', 'WriteAccess'] : ['ReadAccess'];
  const entity = group ? 'team' : 'systemuser';
  const key = `${entity}id`;
  const flowId = env.FLOW_SOLUTION_WORKFLOW_ID;
  const flow = `workflows(${flowId})`;

  const login = await request(`https://login.microsoftonline.com/${env.PP_TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST', redirect: 'error',
    body: new URLSearchParams({
      client_id: env.PP_APP_ID, client_secret: env.PP_CLIENT_SECRET,
      scope: `${org.origin}/.default`, grant_type: 'client_credentials',
    }),
  });
  if (!login.ok) throw new Error(`Dataverse authentication failed (HTTP ${login.status}).`);
  const { access_token: token } = await login.json();
  if (!token) throw new Error('Authentication response did not contain an access token.');

  async function api(path, method = 'GET', body) {
    const response = await request(`${org.origin}/api/data/v9.2/${path}`, {
      method, redirect: 'error',
      headers: {
        Authorization: `Bearer ${token}`, Accept: 'application/json',
        'OData-Version': '4.0', 'OData-MaxVersion': '4.0',
        ...(method === 'GET' && { 'If-None-Match': 'null' }),
        ...(body && { 'Content-Type': 'application/json' }),
        ...(method === 'PATCH' && { 'If-Match': '*' }),
      },
      body: body && JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Dataverse ${method} ${path.split('?')[0]} failed (HTTP ${response.status}): ${detail}`);
    }
    if (response.status !== 204) return response.json();
  }

  const readFlow = () => api(`${flow}?$select=category,type,statecode,_ownerid_value`);
  const record = await readFlow();
  if (record.category !== 5 || record.type !== 1) throw new Error(`${flow} is not a cloud flow definition.`);
  const filter = `azureactivedirectoryobjectid eq ${env.FLOW_SHARE_PRINCIPAL_OBJECT_ID}` +
    (group ? '' : ' and isdisabled eq false');
  const { value } = await api(`${entity}s?$select=${key}&$filter=${encodeURIComponent(filter)}&$top=2`);
  if (value.length !== 1 || !guidPattern.test(value[0][key])) {
    throw new Error(`Expected one Dataverse ${entity} for ${env.FLOW_SHARE_PRINCIPAL_OBJECT_ID}; found ${value.length}.`);
  }
  const principalId = value[0][key].toLowerCase();
  if (record._ownerid_value?.toLowerCase() === principalId) {
    throw new Error('The sharing target owns this workflow; its owner rights cannot be set by sharing.');
  }

  async function readShare() {
    const { PrincipalAccesses } = await api(`RetrieveSharedPrincipalsAndAccess(Target=@p1)?@p1={'@odata.id':'${flow}'}`);
    const share = PrincipalAccesses.find(({ Principal }) =>
      Principal['@odata.type'] === `#Microsoft.Dynamics.CRM.${entity}` &&
      (Principal[key] ?? Principal.ownerid)?.toLowerCase() === principalId);
    return share?.AccessMask.split(',').map(right => right.trim()).sort().join(',');
  }

  const wanted = rights.join(',');
  const before = await readShare();
  if (record.statecode !== 1) {
    console.log(`Activating ${flow}.`);
    await api(flow, 'PATCH', { statecode: 1 });
  }
  if ((await readFlow()).statecode !== 1) throw new Error(`${flow} is not active.`);
  if (before !== wanted) {
    const action = before === undefined ? 'GrantAccess' : 'ModifyAccess';
    console.log(`${action}: ${role} on ${flow} for ${entity} ${principalId}.`);
    await api(action, 'POST', {
      Target: { '@odata.type': 'Microsoft.Dynamics.CRM.workflow', workflowid: flowId },
      PrincipalAccess: {
        Principal: { '@odata.type': `Microsoft.Dynamics.CRM.${entity}`, [key]: principalId },
        AccessMask: rights.join(', '),
      },
    });
  }
  if ((await readShare()) !== wanted) throw new Error(`Could not verify the ${role} share on ${flow}.`);
  console.log(`Verified ${flow} is active and shared as ${role}.`);
}

module.exports = { activateAndShare };
if (require.main === module) {
  activateAndShare(process.env).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
