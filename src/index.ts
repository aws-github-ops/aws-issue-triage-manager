import * as core from '@actions/core';
import {IParameter, Issue, IIssueData} from './issue';
import {GithubApi} from './github';

async function run() {
  core.setOutput('labeled', false.toString());
  core.setOutput('assigned', false.toString());

  const token = core.getInput('github-token');
  const github: GithubApi = new GithubApi(token);
  const content: IIssueData = await github.getIssueContent();

  if (!content.isValidIssueType) {
    core.info(
      'This issue is not the correct target type. Exiting successfully'
    );
    return;
  }

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
      github.triage(issue.defaultArea, issue);
    }
  } else {
    core.info('Assigning winning values to issue');
    github.triage(winningAreaData, issue);
  }
}

run().catch(error => {
  core.setFailed(error.message);
});
