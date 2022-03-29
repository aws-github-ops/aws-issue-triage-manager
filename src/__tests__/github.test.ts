import * as github from '@actions/github';
import * as core from '@actions/core';
import {GithubApi} from '../github';
import {IssueType} from '../issue';

// Shallow clone original @actions/github context
const originalContext = {...github.context};

beforeEach(() => {
  process.env.GITHUB_REPOSITORY = 'aws/test';
  // Mock stdout so that we can verify the output
  process.stdout.write = jest.fn();
});

afterEach(() => {
  // Restore original @actions/github context
  Object.defineProperty(github, 'context', {
    value: originalContext,
  });
  jest.resetAllMocks();
});

test('sets issueNumber, when initialized with an issue payload', () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        issue: {
          number: 12345,
        },
      },
    },
  });
  const githubApi = new GithubApi('GITHUB_TOKEN');

  expect(githubApi['issueNumber']).toStrictEqual(12345);
});

test('sets issueNumber, when initialized with a pull request payload', () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        pull_request: {
          number: 54321,
        },
      },
    },
  });
  const githubApi = new GithubApi('GITHUB_TOKEN');

  expect(githubApi['issueNumber']).toStrictEqual(54321);
});

test('sets action as failed, when initialized with an empty payload', () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {},
    },
  });

  new GithubApi('GITHUB_TOKEN');

  expect(process.exitCode).toBe(core.ExitCode.Failure);
  expect(process.stdout.write).toHaveBeenCalledTimes(1);
  expect(process.stdout.write).toHaveBeenCalledWith(
    expect.stringContaining('::error::Error retrieving issue number')
  );
});

test("setIssueAssignees() requests GitHub's API, when provided an array of assignees", async () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        pull_request: {
          number: 54321,
        },
      },
    },
  });
  const githubApi = new GithubApi('GITHUB_TOKEN');
  // Mock the network request
  githubApi['octokit'].issues.addAssignees = jest.fn();

  await githubApi.setIssueAssignees(['test-assignee-1', 'test-assignee-2']);

  expect(githubApi['octokit'].issues.addAssignees).toHaveBeenCalledTimes(1);
  expect(githubApi['octokit'].issues.addAssignees).toHaveBeenCalledWith({
    assignees: ['test-assignee-1', 'test-assignee-2'],
    issue_number: 54321,
  });
});

test("setIssueLabels() requests GitHub's API, when provided an array of labels", async () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        pull_request: {
          number: 54321,
        },
      },
    },
  });
  const githubApi = new GithubApi('GITHUB_TOKEN');
  // Mock the network request
  githubApi['octokit'].issues.addLabels = jest.fn();

  await githubApi.setIssueLabels(['needs-triage', 'aws-cognito']);

  expect(githubApi['octokit'].issues.addLabels).toHaveBeenCalledTimes(1);
  expect(githubApi['octokit'].issues.addLabels).toHaveBeenCalledWith({
    issue_number: 54321,
    labels: ['needs-triage', 'aws-cognito'],
  });
});

test("setIssueLabels() requests GitHub's API, when provided a set of reviewers", async () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        pull_request: {
          number: 54321,
        },
      },
    },
  });
  const githubApi = new GithubApi('GITHUB_TOKEN');
  // Mock the network request
  githubApi['octokit'].pulls.requestReviewers = jest.fn();

  await githubApi.setReviewers({
    reviewers: ['user1'],
    teamReviewers: ['team1'],
  });

  expect(githubApi['octokit'].pulls.requestReviewers).toHaveBeenCalledTimes(1);
  expect(githubApi['octokit'].pulls.requestReviewers).toHaveBeenCalledWith({
    pull_number: 54321,
    reviewers: ['user1'],
    team_reviewers: ['team1'],
  });
});

test("getIssueContent() requests GitHub's API, when issueNumber is set", async () => {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        pull_request: {
          number: 54321,
        },
      },
    },
  });
  const githubApi = new GithubApi('GITHUB_TOKEN');
  // Mock the network request
  githubApi['octokit'].issues.get = jest.fn().mockReturnValue({
    data: {
      title: 'test-title',
      body: 'test-body',
      labels: [
        {
          name: 'needs-triage',
        },
      ],
    },
  });
  process.env.INPUT_TARGET = 'both';

  const content = await githubApi.getIssueContent();

  expect(githubApi['octokit'].issues.get).toHaveBeenCalledTimes(1);
  expect(githubApi['octokit'].issues.get).toHaveBeenCalledWith({
    issue_number: 54321,
  });
  expect(content).toStrictEqual({
    title: 'test-title',
    body: 'test-body',
    labels: ['needs-triage'],
    isValidIssueType: true,
    issueType: 'issues',
  });
});

test('VerifyIssueType returns true when target is both', async () => {
  process.env.INPUT_TARGET = 'both';
  const data = {
    pull_request: ['pullrequest'],
  };
  const issueType = IssueType.ISSUE;

  const githubApi = new GithubApi('GITHUB_TOKEN');

  expect(githubApi.verifyIssueType(data, issueType)).toStrictEqual(true);
});

test('VerifyIssueType returns correct value when target is issues', async () => {
  process.env.INPUT_TARGET = 'issues';
  const prData = {
    pull_request: ['pullrequest'],
  };
  const issueData = undefined;
  const prIssueType = IssueType.PULL_REQUEST;
  const issueIssueType = IssueType.ISSUE;

  const githubApi = new GithubApi('GITHUB_TOKEN');

  expect(githubApi.verifyIssueType(prData, prIssueType)).toStrictEqual(false);
  // eslint-disable-next-line prettier/prettier
  expect(githubApi.verifyIssueType(issueData, issueIssueType)).toStrictEqual(true);
});

test('VerifyIssueType returns correct value when target is pull-requests', async () => {
  process.env.INPUT_TARGET = 'pull-requests';
  const prData = {
    pull_request: ['pullrequest'],
  };
  const issueData = undefined;
  const prIssueType = IssueType.PULL_REQUEST;
  const issueIssueType = IssueType.ISSUE;

  const githubApi = new GithubApi('GITHUB_TOKEN');

  expect(githubApi.verifyIssueType(prData, prIssueType)).toStrictEqual(true);
  // eslint-disable-next-line prettier/prettier
  expect(githubApi.verifyIssueType(issueData, issueIssueType)).toStrictEqual(false);
});
