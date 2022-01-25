import * as github from "@actions/github";
import * as core from '@actions/core';
import { IIssueData } from "./issue";

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

  public async getIssueContent(): Promise<IIssueData> { 
    const { data } = await this.octokit.issues.get({
      ...this.repo,
      issue_number: this.issueNumber,
    });

    let title: string = data.title;
    let body: string = data.body;
    let labels: string[] = [];

    for(let label of data.labels) {
      labels.push(label.name.toString())
    }

    return {
      title,
      body,
      labels,
    };
  };
}
