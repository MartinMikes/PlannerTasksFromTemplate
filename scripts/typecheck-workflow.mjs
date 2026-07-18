import fs from 'node:fs';
import path from 'node:path';

const workflowPath = path.join(
  process.cwd(),
  'src',
  'CampanulaPlannerFlows',
  'Workflows',
  'CampanulaCreateConcertPlanFromTemplate.json',
);

const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
const rootActions = workflow?.properties?.definition?.actions;

if (!rootActions || typeof rootActions !== 'object') {
  throw new Error('Workflow definition is missing actions.');
}

function checkActions(actions, scopeName) {
  const actionNames = new Set(Object.keys(actions));

  for (const [name, action] of Object.entries(actions)) {
    const runAfter = action?.runAfter ?? {};

    for (const dependencyName of Object.keys(runAfter)) {
      if (!actionNames.has(dependencyName)) {
        throw new Error(
          `Action "${name}" in ${scopeName} depends on missing action "${dependencyName}".`,
        );
      }
    }

    if (action?.actions) {
      checkActions(action.actions, `${scopeName}.${name}`);
    }

    if (action?.else?.actions) {
      checkActions(action.else.actions, `${scopeName}.${name}.else`);
    }
  }
}

checkActions(rootActions, 'root');
