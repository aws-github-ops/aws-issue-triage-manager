import * as github from '@actions/github';
import * as core from '@actions/core';
import { GithubApi } from '../github';

// Shallow clone original @actions/github context
const originalContext = { ...github.context };

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
          name: 'needs-triage'
        }
      ]
    },
  });

  const content = await githubApi.getIssueContent();

  expect(githubApi['octokit'].issues.get).toHaveBeenCalledTimes(1);
  expect(githubApi['octokit'].issues.get).toHaveBeenCalledWith({
    issue_number: 54321,
  });
  expect(content).toStrictEqual({
    title: 'test-title',
    body: 'test-body',
    labels: ['needs-triage'],
  });
});
