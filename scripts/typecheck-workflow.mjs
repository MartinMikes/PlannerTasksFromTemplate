import fs from 'node:fs';
import path from 'node:path';

const WORKFLOW_PATH_SEGMENTS = [
  'src',
  'CampanulaPlannerFlows',
  'Workflows',
  'CampanulaCreateConcertPlanFromTemplate.json',
];

const workflowPath = path.join(process.cwd(), ...WORKFLOW_PATH_SEGMENTS);
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const rootActionMap = workflow?.properties?.definition?.actions;

if (!isActionMap(rootActionMap)) {
  throw new Error('Workflow definition is missing actions.');
}

validateActionDependencies(rootActionMap, 'root');

function isActionMap(value) {
  return Boolean(value) && typeof value === 'object';
}

function validateActionDependencies(actionMap, scopePath) {
  const actionNames = new Set(Object.keys(actionMap));

  for (const [actionName, actionDefinition] of Object.entries(actionMap)) {
    const runAfter = actionDefinition?.runAfter ?? {};

    for (const dependencyName of Object.keys(runAfter)) {
      if (!actionNames.has(dependencyName)) {
        throw new Error(
          `Action "${actionName}" in ${scopePath} depends on missing action "${dependencyName}".`,
        );
      }
    }

    for (const [childScopeSuffix, childActionMap] of getChildActionScopes(actionDefinition)) {
      validateActionDependencies(childActionMap, `${scopePath}.${actionName}${childScopeSuffix}`);
    }
  }
}

function getChildActionScopes(actionDefinition) {
  const childScopes = [];

  if (isActionMap(actionDefinition?.actions)) {
    childScopes.push(['', actionDefinition.actions]);
  }

  if (isActionMap(actionDefinition?.else?.actions)) {
    childScopes.push(['.else', actionDefinition.else.actions]);
  }

  return childScopes;
}
