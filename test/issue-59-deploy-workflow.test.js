const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = path.join(__dirname, '..');
const deployWorkflowPath = path.join(workspaceRoot, '.github', 'workflows', 'deploy.yml');
const connectorParamsPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerFlows',
  'Connectors',
  'campa_planner_graph_connectionparameters.json',
);

const deployWorkflow = fs.readFileSync(deployWorkflowPath, 'utf8');
const connectorParams = fs.readFileSync(connectorParamsPath, 'utf8');

test('packages a staged managed solution artifact and imports that exact zip', () => {
  assert.match(deployWorkflow, /SOLUTION_PACK_FOLDER:\s*out\/CampanulaPlannerFlows\b/);
  assert.match(deployWorkflow, /- name: Prepare staged solution source/);
  assert.match(deployWorkflow, /rm -rf "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/);
  assert.match(
    deployWorkflow,
    /cp -R "\$\{\{ env\.SOLUTION_FOLDER \}\}" "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  );
  assert.match(
    deployWorkflow,
    /PARAMS_FILE="\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}\/Connectors\/campa_planner_graph_connectionparameters\.json"/,
  );
  assert.match(
    deployWorkflow,
    /--folder "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  );
  assert.match(deployWorkflow, /path:\s*\$\{\{ env\.SOLUTION_ZIP \}\}/);
  assert.match(deployWorkflow, /solution-file:\s*\$\{\{ env\.SOLUTION_ZIP \}\}/);
  assert.match(deployWorkflow, /activate-plugins:\s*true/);
  assert.match(deployWorkflow, /publish-changes:\s*true/);
});

test('keeps the checked-in connector source on the placeholder contract', () => {
  assert.match(connectorParams, /\$\{MICROSOFT_ENTRA_APP_ID\}/);
});
