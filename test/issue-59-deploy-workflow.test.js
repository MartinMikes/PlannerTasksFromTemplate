const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = path.join(__dirname, '..');
const deployWorkflowPath = path.join(workspaceRoot, '.github', 'workflows', 'deploy.yml');
const connectorBootstrapWorkflowPath = path.join(
  workspaceRoot,
  '.github',
  'workflows',
  'deploy-connector.yml',
);
const connectorParamsPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerGraphConnector',
  'Connectors',
  'campa_planner_graph_connectionparameters.json',
);
const connectorIconPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerGraphConnector',
  'Connectors',
  'campa_planner_graph_icon.png',
);
const connectorDefinitionPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerGraphConnector',
  'Connectors',
  'campa_planner_graph_openapidefinition.json',
);
const flowSolutionMetadataPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerFlows',
  'Other',
  'Solution.xml',
);
const connectorSolutionMetadataPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerGraphConnector',
  'Other',
  'Solution.xml',
);
const workflowMetadataPath = path.join(
  workspaceRoot,
  'src',
  'CampanulaPlannerFlows',
  'Workflows',
  'CampanulaCreateConcertPlanFromTemplate.json.data.xml',
);

const deployWorkflow = fs.readFileSync(deployWorkflowPath, 'utf8');
const connectorBootstrapWorkflow = fs.readFileSync(connectorBootstrapWorkflowPath, 'utf8');
const connectorParams = fs.readFileSync(connectorParamsPath, 'utf8');
const flowSolutionMetadata = fs.readFileSync(flowSolutionMetadataPath, 'utf8');
const connectorSolutionMetadata = fs.readFileSync(connectorSolutionMetadataPath, 'utf8');
const workflowMetadata = fs.readFileSync(workflowMetadataPath, 'utf8');

const stagedSolutionWorkflowPatterns = [
  /SOLUTION_PACK_FOLDER:\s*out\/CampanulaPlannerFlows\b/,
  /CONNECTOR_SOLUTION_PACK_FOLDER:\s*out\/CampanulaPlannerGraphConnector\b/,
  /CONNECTOR_SOLUTION_ZIP:\s*out\/CampanulaPlannerGraphConnector\.zip/,
  /- name: Prepare staged solution source/,
  /rm -rf "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  /rm -rf "\$\{\{ env\.CONNECTOR_SOLUTION_PACK_FOLDER \}\}"/,
  /cp -R "\$\{\{ env\.SOLUTION_FOLDER \}\}" "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  /cp -R "\$\{\{ env\.CONNECTOR_SOLUTION_FOLDER \}\}" "\$\{\{ env\.CONNECTOR_SOLUTION_PACK_FOLDER \}\}"/,
  /PARAMS_FILE="\$\{\{ env\.CONNECTOR_SOLUTION_PACK_FOLDER \}\}\/Connectors\/campa_planner_graph_connectionparameters\.json"/,
  /--folder "\$\{\{ env\.SOLUTION_PACK_FOLDER \}\}"/,
  /--folder "\$\{\{ env\.CONNECTOR_SOLUTION_PACK_FOLDER \}\}"/,
  /path:\s*\|[\s\S]*\$\{\{ env\.SOLUTION_ZIP \}\}/,
  /path:\s*\|[\s\S]*\$\{\{ env\.CONNECTOR_SOLUTION_ZIP \}\}/,
  /"\$POWERPLATFORMTOOLS_PACPATH" solution import/,
  /--path "\$\{\{ env\.SOLUTION_ZIP \}\}"/,
  /--path "\$\{\{ env\.CONNECTOR_SOLUTION_ZIP \}\}"/,
  /--activate-plugins/,
  /--publish-changes/,
];

function assertMatchesAllPatterns(text, patterns) {
  for (const pattern of patterns) {
    assert.match(text, pattern);
  }
}

test('packages a staged managed solution artifact and imports that exact zip', () => {
  assertMatchesAllPatterns(deployWorkflow, stagedSolutionWorkflowPatterns);
});

test('bootstraps the connector without requiring a delegated Graph connection', () => {
  assert.match(connectorBootstrapWorkflow, /on:\s+\n\s+workflow_dispatch:/);
  assert.match(
    connectorBootstrapWorkflow,
    /CONNECTOR_SOLUTION_FOLDER:\s*src\/CampanulaPlannerGraphConnector/,
  );
  assert.match(
    connectorBootstrapWorkflow,
    /CONNECTOR_SOLUTION_ZIP:\s*out\/CampanulaPlannerGraphConnector\.zip/,
  );
  assert.match(
    connectorBootstrapWorkflow,
    /PP_CONNECTOR_APP_ID: \$\{\{ vars\.PP_CONNECTOR_APP_ID \}\}/,
  );
  assert.match(connectorBootstrapWorkflow, /Expected placeholder/);
  assert.match(connectorBootstrapWorkflow, /solution pack/);
  assert.match(connectorBootstrapWorkflow, /solution import/);
  assert.match(
    connectorBootstrapWorkflow,
    /--path "\$\{\{ env\.CONNECTOR_SOLUTION_ZIP \}\}"/,
  );
  assert.doesNotMatch(
    connectorBootstrapWorkflow,
    /PP_GRAPH_CONNECTION_ID:\s*\$\{\{ vars\.PP_GRAPH_CONNECTION_ID \}\}/,
  );
  assert.doesNotMatch(
    connectorBootstrapWorkflow,
    /require_guid "PP_GRAPH_CONNECTION_ID"/,
  );
});

test('rejects the connector ID when used as the OAuth app ID', () => {
  for (const workflow of [deployWorkflow, connectorBootstrapWorkflow]) {
    assert.match(workflow, /reject_connector_id_as_app_id\(\)/);
    assert.match(
      workflow,
      /PP_CONNECTOR_APP_ID is set to the custom connector ID/,
    );
  }
});

test('applies the tracked connector icon after importing the prerequisite', () => {
  const icon = fs.readFileSync(connectorIconPath);
  assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(fs.statSync(connectorDefinitionPath).size > 0);

  for (const workflow of [deployWorkflow, connectorBootstrapWorkflow]) {
    assert.match(
      workflow,
      /CONNECTOR_ID:\s*aa5c469a-b5dd-4963-917c-66bf35639bb3/,
    );
    assert.match(
      workflow,
      /CONNECTOR_ICON_FILE:\s*src\/CampanulaPlannerGraphConnector\/Connectors\/campa_planner_graph_icon\.png/,
    );
    assert.match(
      workflow,
      /CONNECTOR_API_DEFINITION_FILE:\s*src\/CampanulaPlannerGraphConnector\/Connectors\/campa_planner_graph_openapidefinition\.json/,
    );
    assert.match(workflow, /connector update/);
    assert.match(workflow, /--connector-id "\$\{\{ env\.CONNECTOR_ID \}\}"/);
    assert.match(workflow, /--icon-file "\$icon_file"/);
    assert.match(
      workflow,
      /--api-definition-file "(?:\$\{\{ env\.CONNECTOR_API_DEFINITION_FILE \}\}|\$api_definition_file)"/,
    );
  }

  const deployIconIdx = deployWorkflow.indexOf('- name: Apply Graph connector icon');
  const deployConnectorImportIdx = deployWorkflow.indexOf('- name: Import Graph connector prerequisite solution');
  const bootstrapIconIdx = connectorBootstrapWorkflow.indexOf('- name: Apply Graph connector icon');
  const bootstrapImportIdx = connectorBootstrapWorkflow.indexOf('- name: Import Graph connector prerequisite solution');
  assert.notStrictEqual(
    deployConnectorImportIdx,
    -1,
    'Expected connector import step to exist',
  );
  assert.notStrictEqual(deployIconIdx, -1, 'Expected icon step to exist');
  assert.ok(
    deployConnectorImportIdx < deployIconIdx,
    'Normal deployment must import before applying the icon',
  );
  assert.notStrictEqual(
    bootstrapImportIdx,
    -1,
    'Expected connector import step to exist',
  );
  assert.notStrictEqual(bootstrapIconIdx, -1, 'Expected icon step to exist');
  assert.ok(
    bootstrapImportIdx < bootstrapIconIdx,
    'Bootstrap must import before applying the icon',
  );
});

test('uses connector metadata from the selected release or staged package', () => {
  const metadataStepIdx = deployWorkflow.indexOf(
    '- name: Select connector metadata from deployed artifact',
  );
  const iconStepIdx = deployWorkflow.indexOf('- name: Apply Graph connector icon');
  assert.notStrictEqual(metadataStepIdx, -1, 'Expected connector metadata selection step to exist');
  assert.notStrictEqual(iconStepIdx, -1, 'Expected connector icon step to exist');
  assert.ok(
    metadataStepIdx < iconStepIdx,
    'Connector metadata must be selected before the connector update',
  );

  const metadataStep = deployWorkflow.slice(metadataStepIdx, iconStepIdx);
  assert.match(
    metadataStep,
    /steps\.manualRelease\.outputs\.pack_source.*== "false"/,
  );
  assert.match(
    metadataStep,
    /unzip -p "\$\{\{ env\.CONNECTOR_SOLUTION_ZIP \}\}" \\\s+Connector\/campa_planner_graph_openapidefinition\.json/,
  );
  assert.match(
    metadataStep,
    /git show "\$\{release_tag\}:src\/CampanulaPlannerGraphConnector\/Connectors\/campa_planner_graph_icon\.png"/,
  );
  assert.match(
    deployWorkflow,
    /api_definition_file="\$\{\{ steps\.connectorMetadata\.outputs\.api_definition_file \}\}"/,
  );
  assert.match(
    deployWorkflow,
    /icon_file="\$\{\{ steps\.connectorMetadata\.outputs\.icon_file \}\}"/,
  );
});

test('redeploys the latest published release without a version input', () => {
  assertMatchesAllPatterns(deployWorkflow, [
    /ref: \$\{\{ github\.event_name == 'workflow_dispatch' && 'main' \|\| github\.ref \}\}/,
    /- name: Resolve last published release/,
    /id: manualRelease/,
    /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/releases\/latest" --jq '\.tag_name'/,
    /gh release download "\$release_tag"/,
    /\$2 == expected && !found \{ print \$1; found=1 \}/,
    /git checkout --detach "\$version_commit"/,
    /echo "pack_source=false" >> "\$GITHUB_OUTPUT"/,
    /echo "pack_source=true" >> "\$GITHUB_OUTPUT"/,
    /steps\.manualRelease\.outputs\.pack_source == 'true'/,
  ]);
  assert.doesNotMatch(deployWorkflow, /inputs\.release_version|^\s+release_version:/m);
  assert.doesNotMatch(deployWorkflow, /Create manual GitHub release/);
});

test('attaches release assets only after both solution imports succeed', () => {
  const connectorImportIdx = deployWorkflow.indexOf(
    '- name: Import Graph connector prerequisite solution',
  );
  const flowImportIdx = deployWorkflow.indexOf('- name: Import solution to Power Platform');
  const releaseAssetIdx = deployWorkflow.indexOf(
    '- name: Attach validated solution zips to GitHub release',
  );

  assert.ok(connectorImportIdx < flowImportIdx, 'Connector import must precede Flow import');
  assert.ok(flowImportIdx < releaseAssetIdx, 'Release assets must follow Flow import');
});

test('can rebuild current source for a clean target instead of reusing release assets', () => {
  assertMatchesAllPatterns(deployWorkflow, [
    /rebuild_from_source:/,
    /type: boolean/,
    /REBUILD_FROM_SOURCE: \$\{\{ inputs\.rebuild_from_source \}\}/,
    /Manual deployment will rebuild both managed solution assets from current main\./,
    /echo "pack_source=true" >> "\$GITHUB_OUTPUT"/,
  ]);
});

test('validates required configuration before semantic-release to prevent orphaned releases', () => {
  assertMatchesAllPatterns(deployWorkflow, [
    /- name: Validate required configuration/,
    /if: github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'/,
    /require_guid\(\) \{/,
    /PP_CONNECTOR_APP_ID: \$\{\{ vars\.PP_CONNECTOR_APP_ID \}\}/,
    /PP_CONNECTOR_APP_ID variable is not set/,
    /is still set to the placeholder value/,
    /must be a GUID/,
    /require_connection_resource_id "PP_GRAPH_CONNECTION_ID" "\$PP_GRAPH_CONNECTION_ID"/,
    /reject_connection_id_confusion\(\)/,
    /PP_GRAPH_CONNECTION_ID.*PP_CONNECTOR_APP_ID/,
    /PP_GRAPH_CONNECTION_ID.*custom connector component ID/,
  ]);
  const validateIdx = deployWorkflow.indexOf('- name: Validate required configuration');
  const semanticReleaseIdx = deployWorkflow.indexOf('- name: Determine release version');
  assert.ok(
    validateIdx < semanticReleaseIdx,
    'Validate step must appear before Determine release version to prevent orphaned releases',
  );
});

test('accepts connection resource IDs that contain a GUID', () => {
  assert.match(deployWorkflow, /require_connection_resource_id\(\) \{/);
  assert.match(deployWorkflow, /must contain a GUID/);

  for (const connectionName of [
    'PP_FORMS_CONNECTION_ID',
    'PP_EXCEL_CONNECTION_ID',
    'PP_PLANNER_CONNECTION_ID',
    'PP_GRAPH_CONNECTION_ID',
    'PP_OUTLOOK_CONNECTION_ID',
  ]) {
    assert.match(
      deployWorkflow,
      new RegExp(`require_connection_resource_id "${connectionName}" "\\$${connectionName}"`),
    );
    assert.doesNotMatch(
      deployWorkflow,
      new RegExp(`require_guid "${connectionName}" "\\$${connectionName}"`),
    );
  }
});

test('raises and commits the same release version for both solutions', () => {
  const versionStepStart = deployWorkflow.indexOf('- name: Set solution versions');
  const versionStepEnd = deployWorkflow.indexOf(
    '- name: Commit updated solution versions',
    versionStepStart,
  );
  assert.notStrictEqual(versionStepStart, -1, 'Expected solution version step to exist');
  assert.notStrictEqual(versionStepEnd, -1, 'Expected solution version commit step to exist');

  const versionStep = deployWorkflow.slice(versionStepStart, versionStepEnd);
  assert.match(versionStep, /steps\.semanticRelease\.outputs\.new_release_version/);
  assert.match(versionStep, /env\.SOLUTION_FOLDER/);
  assert.match(versionStep, /env\.CONNECTOR_SOLUTION_FOLDER/);
  assert.match(versionStep, /Missing <Version> element/);
  assert.match(versionStep, /Failed to set .* to version/);

  const commitStepEnd = deployWorkflow.indexOf('\n\n      - name:', versionStepEnd);
  const commitStep = deployWorkflow.slice(versionStepEnd, commitStepEnd);
  assert.match(commitStep, /SOLUTION_FOLDER.*Other\/Solution\.xml/);
  assert.match(commitStep, /CONNECTOR_SOLUTION_FOLDER.*Other\/Solution\.xml/);
  assert.match(flowSolutionMetadata, /<Version>[^<]+<\/Version>/);
  assert.match(connectorSolutionMetadata, /<Version>[^<]+<\/Version>/);
});

test('keeps the checked-in Flow and connector solution versions aligned', () => {
  const readSolutionVersion = (metadata) => metadata.match(/<Version>([^<]+)<\/Version>/)?.[1];
  const flowVersion = readSolutionVersion(flowSolutionMetadata);
  const connectorVersion = readSolutionVersion(connectorSolutionMetadata);

  assert.ok(flowVersion, 'Flow solution must declare a version');
  assert.ok(connectorVersion, 'Connector solution must declare a version');
  assert.equal(connectorVersion, flowVersion);
});

test('keeps the checked-in connector source on the placeholder contract', () => {
  assert.match(connectorParams, /\$\{MICROSOFT_ENTRA_APP_ID\}/);
  assert.match(connectorSolutionMetadata, /<UniqueName>CampanulaPlannerGraphConnector<\/UniqueName>/);
  assert.match(
    connectorSolutionMetadata,
    /<RootComponent type="372" id="\{aa5c469a-b5dd-4963-917c-66bf35639bb3\}"/,
  );
  assert.doesNotMatch(flowSolutionMetadata, /<RootComponent type="372"/);
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
    /--settings-file "\$\{\{ env\.DEPLOYMENT_SETTINGS_FILE \}\}"/,
    /--activate-plugins/,
    /- name: Import Graph connector prerequisite solution/,
    /CONNECTOR_SOLUTION_ZIP/,
  ]);
  const connectorImportIdx = deployWorkflow.indexOf('- name: Import Graph connector prerequisite solution');
  const flowImportIdx = deployWorkflow.indexOf('- name: Import solution to Power Platform');
  assert.notStrictEqual(connectorImportIdx, -1, 'Expected connector import step to exist');
  assert.notStrictEqual(flowImportIdx, -1, 'Expected Flow import step to exist');
  assert.ok(connectorImportIdx < flowImportIdx, 'Connector prerequisite must import before the Flow solution');
  assert.doesNotMatch(deployWorkflow, /microsoft\/powerplatform-actions\/import-solution@/);
  assert.doesNotMatch(deployWorkflow, /convert-to-managed/);
  assert.match(workflowMetadata, /<StateCode>0<\/StateCode>/);
  assert.match(workflowMetadata, /<StatusCode>1<\/StatusCode>/);
});
