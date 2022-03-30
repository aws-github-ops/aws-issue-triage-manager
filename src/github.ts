import * as github from '@actions/github';
import * as core from '@actions/core';
import {IDefaultArea, IIssueData, Issue, IssueType} from './issue';

export interface IRepo {
  owner: string;
  repo: string;
}

export interface IReviewers {
  reviewers?: string[];
  teamReviewers?: string[];
}

export class GithubApi {
  private octokit;
  private repo: IRepo;
  private issueNumber: number | undefined;

  constructor(token: string) {
    this.octokit = github.getOctokit(token);
    this.repo = github.context.repo;

    if (github.context.payload.issue) {
      this.issueNumber = github.context.payload.issue.number;
    } else if (github.context.payload.pull_request) {
      this.issueNumber = github.context.payload.pull_request.number;
    } else {
      core.setFailed('Error retrieving issue number');
    }
  }

  public async triage(area: IDefaultArea, issue: Issue) {
    // eslint-disable-next-line prettier/prettier
    if (area.reviewers && issue.issueType === IssueType.PULL_REQUEST) this.setReviewers(area.reviewers);
    if (area.assignees) this.setIssueAssignees(area.assignees);
    if (area.labels) this.setIssueLabels(area.labels);
  }

  public async setIssueAssignees(assignees: string[]) {
    if (!assignees.length) return;
    await this.octokit.rest.issues.addAssignees({
      ...this.repo,
      issue_number: this.issueNumber,
      assignees,
    });
  }

  public async setIssueLabels(labels: string[]) {
    if (!labels.length) return;
    await this.octokit.rest.issues.addLabels({
      ...this.repo,
      issue_number: this.issueNumber,
      labels,
    });
  }

  public async setReviewers(reviewers: IReviewers) {
    if (!reviewers.reviewers && !reviewers.teamReviewers) return;
    await this.octokit.rest.pulls.requestReviewers({
      ...this.repo,
      pull_number: this.issueNumber,
      reviewers: reviewers.reviewers ? reviewers.reviewers : undefined,
      // eslint-disable-next-line prettier/prettier
      team_reviewers: reviewers.teamReviewers ? reviewers.teamReviewers : undefined,
    });
  }

  public async getIssueContent(): Promise<IIssueData> {
    const {data} = await this.octokit.rest.issues.get({
      ...this.repo,
      issue_number: this.issueNumber,
    });

    const issueType = this.getIssueType(data.pull_request);
    const isValidIssueType = this.verifyIssueType(data.pull_request, issueType);

    if (!isValidIssueType) return {isValidIssueType: false};

    const title: string = data.title;
    const body: string = data.body;
    const labels: string[] = [];

    for (const label of data.labels) {
      labels.push(label.name.toString());
    }

    return {
      title,
      body,
      labels,
      isValidIssueType,
      issueType,
    };
  }

  public getIssueType(data): IssueType {
    return data ? IssueType.PULL_REQUEST : IssueType.ISSUE;
  }

  public verifyIssueType(data, issueType): boolean {
    const target = core.getInput('target', {required: false});

    // eslint-disable-next-line prettier/prettier
    if (target === 'both')
      return true;
    else if (target === IssueType.ISSUE && issueType === IssueType.ISSUE)
      return true;
    // eslint-disable-next-line prettier/prettier
    else if (target === IssueType.PULL_REQUEST && issueType === IssueType.PULL_REQUEST)
      return true;

    return false;
  }
}
