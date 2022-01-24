import * as github from "@actions/github";
import * as core from '@actions/core';

export interface IRepo {
  owner: string;
  repo: string;
}

export class GithubApi {
  private octokit;
  private repo: IRepo;
  private issueNumber: number | undefined;

  constructor(token: string) {
    this.octokit = new github.GitHub(token);
    this.repo = github.context.repo;

    if (github.context.payload.issue) { 
      this.issueNumber = github.context.payload.issue.number;
    } else if (github.context.payload.pull_request) { 
      this.issueNumber = github.context.payload.pull_request.number;
    } else {
      core.setFailed(`Error retrieving issue number`);
    }
  }

  public async setIssueAssignees(assignees: string[]) {
    if (!assignees.length) return;
    await this.octokit.issues.addAssignees({
      ...this.repo,
      issue_number: this.issueNumber,
      assignees,
    });
  }

  public async setIssueLabels(labels: string[]) {
    if (!labels.length) return;
    await this.octokit.issues.addLabels({
      ...this.repo,
      issue_number: this.issueNumber,
      labels,
    });
  }

  public async getIssueContent(): Promise<string[]> { 
    let content: string[] = [];
  
    const { data } = await this.octokit.issues.get({
      ...this.repo,
      issue_number: this.issueNumber,
    });
  
    content.push(data.title, data.body);
    return content;
  };

  public async verifyIssueLabels(includedLabels: string[] | undefined, excludedLabels: string[] | undefined): Promise<boolean> {
    const { data } = await this.octokit.issues.get({
      ...this.repo,
      issue_number: this.issueNumber,
    });

    let containsIncludedLabel = false;
    let containsExcludedLabel = false;

    for (let label of data.labels) {
      if (includedLabels) {
        if (includedLabels.includes(label.name.toString())) containsIncludedLabel = true;
      } else {
        containsIncludedLabel = true;
      }

      if (excludedLabels) {
        if (excludedLabels.includes(label.name)) {
          containsExcludedLabel = true;
          console.log(`This issue contains the excluded label ${label.name}`);
        }
      }
    }

    if (!containsIncludedLabel) {
      console.log('This issue contains no required labels');
    }

    if (!containsIncludedLabel || containsExcludedLabel) {
      return false;
    } else {
      return true;
    }
  }
}
