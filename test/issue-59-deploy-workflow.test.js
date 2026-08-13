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
const workflowMetadataPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerFlows',
  'Workflows',
  'CampanulaCreateConcertPlanFromTemplate.json.data.xml',
);

const deployWorkflow = fs.readFileSync(deployWorkflowPath, 'utf8');
const connectorParams = fs.readFileSync(connectorParamsPath, 'utf8');
const workflowMetadata = fs.readFileSync(workflowMetadataPath, 'utf8');

const stagedSolutionWorkflowPatterns = [
  /SOLUTION_PACK_FOLDER:\s*out\/CampanulaPlannerFlows\b/,
  /- name: Prepare staged solution source/,
  /rm -rf "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  /cp -R "\$\{\{ env\.SOLUTION_FOLDER \}\}" "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  /PARAMS_FILE="\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}\/Connectors\/campa_planner_graph_connectionparameters\.json"/,
  /--folder "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  /path:\s*\$\{\{ env\.SOLUTION_ZIP \}\}/,
  /solution-file:\s*\$\{\{ env\.SOLUTION_ZIP \}\}/,
  /activate-plugins:\s*true/,
  /publish-changes:\s*true/,
];

function assertMatchesAllPatterns(text, patterns) {
  for (const pattern of patterns) {
    assert.match(text, pattern);
  }
}

test('packages a staged managed solution artifact and imports that exact zip', () => {
  assertMatchesAllPatterns(deployWorkflow, stagedSolutionWorkflowPatterns);
});

test('redeploys the latest published release without a version input', () => {
  assertMatchesAllPatterns(deployWorkflow, [
    /ref: \$\{\{ github\.event_name == 'workflow_dispatch' && 'main' \|\| github\.ref \}\}/,
    /- name: Resolve last published release/,
    /id: manualRelease/,
    /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/releases\/latest" --jq '\.tag_name'/,
    /gh release download "\$release_tag"/,
    /git checkout --detach "\$version_commit"/,
    /echo "pack_source=false" >> "\$GITHUB_OUTPUT"/,
    /echo "pack_source=true" >> "\$GITHUB_OUTPUT"/,
    /steps\.manualRelease\.outputs\.pack_source == 'true'/,
  ]);
  assert.doesNotMatch(deployWorkflow, /inputs\.release_version|^\s+release_version:/m);
  assert.doesNotMatch(deployWorkflow, /Create manual GitHub release/);
});

test('validates required configuration before semantic-release to prevent orphaned releases', () => {
  assertMatchesAllPatterns(deployWorkflow, [
    /- name: Validate required configuration/,
    /if: github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/,
    /PP_CONNECTOR_APP_ID: \$\{\{ vars\.PP_CONNECTOR_APP_ID \}\}/,
    /PP_CONNECTOR_APP_ID variable is not set/,
  ]);
  const validateIdx = deployWorkflow.indexOf('- name: Validate required configuration');
  const semanticReleaseIdx = deployWorkflow.indexOf('- name: Determine release version');
  assert.ok(
    validateIdx < semanticReleaseIdx,
    'Validate step must appear before Determine release version to prevent orphaned releases',
  );
});

test('keeps the checked-in connector source on the placeholder contract', () => {
  assert.match(connectorParams, /\$\{MICROSOFT_ENTRA_APP_ID\}/);
});

test('maps target connections and imports the Flow as active', () => {
  assertMatchesAllPatterns(deployWorkflow, [
    /PP_FORMS_CONNECTION_ID/,
    /PP_EXCEL_CONNECTION_ID/,
    /PP_PLANNER_CONNECTION_ID/,
    /PP_GRAPH_CONNECTION_ID/,
    /PP_OUTLOOK_CONNECTION_ID/,
    /solution create-settings/,
    /campa_sharedmicrosoftforms_createconcertplan/,
    /campa_sharedexcelonlinebusiness_createconcertplan/,
    /campa_sharedplanner_createconcertplan/,
    /campa_sharedcampanulaplannergraph_createconcertplan/,
    /campa_sharedoffice365_createconcertplan/,
    /Deployment settings must contain exactly the five expected connection references/,
    /use-deployment-settings-file:\s*true/,
    /deployment-settings-file:/,
    /activate-plugins:\s*true/,
  ]);
  assert.match(workflowMetadata, /<StateCode>0<\/StateCode>/);
  assert.match(workflowMetadata, /<StatusCode>1<\/StatusCode>/);
});
