import * as core from '@actions/core';
import {IParameter, Issue, IIssueData} from './issue';
import {GithubApi} from './github';

async function run() {
  core.setOutput('labeled', false.toString());
  core.setOutput('assigned', false.toString());

  const token = core.getInput('github-token');
  const github: GithubApi = new GithubApi(token);
  const content: IIssueData = await github.getIssueContent();
  const includedLabels: string[] | undefined = core
    .getInput('included-labels', {required: false})
    .replace(/\[|\]/gi, '')
    .split('|');
  const excludedLabels: string[] | undefined = core
    .getInput('excluded-labels', {required: false})
    .replace(/\[|\]/gi, '')
    .split('|');

  const issue: Issue = new Issue(content);
  const winningAreaData: IParameter = issue.getWinningAreaData(
    issue.determineArea()
  );

  if (includedLabels[0] || excludedLabels[0]) {
    if (!issue.verifyIssueLabels(includedLabels, excludedLabels)) {
      core.info('Issue failed label validation. Exiting successfully');
      return;
    }
  }

  if (winningAreaData.area === '') {
    core.info('Keywords not included in this issue');
    if (issue.defaultArea) {
      core.info('Assigning default values to issue');
      if (issue.defaultArea.assignees)
        github.setIssueAssignees(issue.defaultArea.assignees);
      if (issue.defaultArea.labels)
        github.setIssueLabels(issue.defaultArea.labels);
    }
  } else {
    if (winningAreaData.assignees)
      github.setIssueAssignees(winningAreaData.assignees);
    if (winningAreaData.labels) github.setIssueLabels(winningAreaData.labels);
    core.setOutput('labeled', true.toString());
    core.setOutput('assigned', true.toString());
  }
}

run().catch(error => {
  core.setFailed(error.message);
});
