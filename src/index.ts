import * as core from "@actions/core";
import { IParameter, Issue } from './issue';
import { GithubApi } from './github';

async function run() {
  core.setOutput("labeled", false.toString());
  core.setOutput("assigned", false.toString());

  const token = core.getInput('github-token');
  const github: GithubApi = new GithubApi(token);
  const content: string[] = await github.getIssueContent();
  const includedLabels: string[] | undefined = core.getInput('included-labels', { required: false }).replace(/\[|\]/gi, '').split('|');
  const excludedLabels: string[] | undefined = core.getInput('excluded-labels', { required: false }).replace(/\[|\]/gi, '').split('|');
  if (includedLabels.length || excludedLabels.length) {
    if (!await github.verifyIssueLabels(includedLabels, excludedLabels)) {
      console.log("Issue failed label validation. Exiting successfully")
      return;
    }
  }

  const issue: Issue = new Issue(content);
  const winningAreaData: IParameter = issue.getWinningAreaData(issue.determineArea())

  if (winningAreaData.area === '') { 
    console.log("Keywords not included in this issue");
    if (issue.defaultArea) {
      if (issue.defaultArea.assignees) github.setIssueAssignees(issue.defaultArea.assignees);
      if (issue.defaultArea.labels) github.setIssueLabels(issue.defaultArea.labels);   
    }
  } else {
    if (winningAreaData.assignees) github.setIssueAssignees(winningAreaData.assignees);
    if (winningAreaData.labels) github.setIssueLabels(winningAreaData.labels);
    core.setOutput("labeled", true.toString());
    core.setOutput("assigned", true.toString());
  }
}

run().catch((error) => {
  core.setFailed(error.message);
});
