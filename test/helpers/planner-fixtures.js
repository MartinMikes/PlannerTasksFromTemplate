const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = path.join(__dirname, '..', '..');

function readJson(relativePathSegments) {
  const filePath = path.join(workspaceRoot, ...relativePathSegments);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const workflow = readJson([
  'src',
  'CampanulaPlannerFlows',
  'Workflows',
  'CampanulaCreateConcertPlanFromTemplate.json',
]);

const connector = readJson([
  'src',
  'CampanulaPlannerFlows',
  'Connectors',
  'campa_planner_graph_openapidefinition.json',
]);

const rootActions = workflow.properties.definition.actions;

function getRootAction(actionName) {
  return rootActions[actionName];
}

function readActionOperationId(action) {
  return action?.inputs?.host?.operationId;
}

function readActionParameters(action) {
  return JSON.stringify(action?.inputs?.parameters ?? {});
}

module.exports = {
  connector,
  getRootAction,
  readActionOperationId,
  readActionParameters,
  rootActions,
  workflow,
};
