import {Issue} from '../issue';

test('removes excluded characters from title, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  const content = '(aws-cognito): This is a title';

  const issue = new Issue({
    title: content,
  });

  expect(issue['titleIssueWords']).toStrictEqual([
    '',
    'aws-cognito',
    ':',
    'This',
    'is',
    'a',
    'title',
  ]);
});

test('removes excluded characters from body, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';

  const issue = new Issue({
    title,
    body,
  });

  expect(issue['bodyIssueWords']).toStrictEqual([
    '',
    'This',
    '',
    'is',
    'a',
    'body',
  ]);
});

test('sets parameters, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
    },
  ]);
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';

  const issue = new Issue({
    title,
    body,
  });

  expect(issue.parameters).toStrictEqual([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
    },
  ]);
});

test('sets defaultArea, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  process.env['INPUT_DEFAULT-AREA'] = JSON.stringify({
    labels: ['a', 'b', 'c'],
    assignees: ['d', 'e', 'f'],
  });
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';

  const issue = new Issue({
    title,
    body,
  });

  expect(issue.defaultArea).toStrictEqual({
    labels: ['a', 'b', 'c'],
    assignees: ['d', 'e', 'f'],
  });
});

test('sets similarity, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  process.env.INPUT_SIMILARITY = '0.72';
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';

  const issue = new Issue({
    title,
    body,
  });

  expect(issue['similarity']).toStrictEqual(0.72);
});

test('sets bodyValue, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  process.env['INPUT_BODY-VALUE'] = '0.34';
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';

  const issue = new Issue({
    title,
    body,
  });

  expect(issue['bodyValue']).toStrictEqual(0.34);
});

test('determineArea() returns aws-cognito, when provided cognito parameters and content', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const title = '(aws-cognito): This is a title';
  const issue = new Issue({
    title,
  });

  const winningArea = issue.determineArea();

  expect(winningArea).toStrictEqual('aws-cognito');
});

test('getWinningAreaData() returns expected area data, when provided the winning area', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const title = '(aws-cognito): This is a title';
  const issue = new Issue({
    title,
  });
  const winningArea = issue.determineArea();

  const winningAreaData = issue.getWinningAreaData(winningArea);

  expect(winningAreaData).toStrictEqual({
    area: 'aws-cognito',
    assignees: ['d', 'e', 'f'],
    keywords: ['cognito'],
    labels: ['a', 'b', 'c'],
  });
});

test('scoreArea() returns a map containing one area, when provided a single entry', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';
  const issue = new Issue({
    title,
    body,
  });

  const winningArea = issue['scoreArea']('aws-cognito', new Map(), title);

  expect(winningArea).toStrictEqual(new Map([['aws-cognito', title]]));
});

test('decideWinner() returns aws-cognito, when provided a map with a single entry', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';
  const issue = new Issue({
    title,
    body,
  });

  const winningArea = issue['decideWinner'](new Map([['aws-cognito', 0.78]]));

  expect(winningArea).toStrictEqual('aws-cognito');
});

test('isSimilar() returns 20.52, when provided two slightly different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const issue = new Issue({});

  const winningArea = issue['isSimilar'](
    '(aws-cognito) This is a title',
    '(aws-cognto) This is a title'
  );

  expect(winningArea).toStrictEqual(20.52);
});

test('isSimilar() returns 20.88, when provided two identical strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const issue = new Issue({});

  const winningArea = issue['isSimilar'](
    '(aws-cognito) This is a title',
    '(aws-cognito) This is a title'
  );

  expect(winningArea).toStrictEqual(20.88);
});

test('isSimilar() returns 19.08, when provided two completely different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const issue = new Issue({});

  const winningArea = issue['isSimilar'](
    '(aws-cognito) This is a title',
    '(taco-truck) free tacos!'
  );

  expect(winningArea).toStrictEqual(19.08);
});

test('similarStrings() returns true, when provided two identical strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const issue = new Issue({});

  const winningArea = issue['similarStrings'](
    '(aws-cognito) This is a title',
    '(aws-cognito) This is a title'
  );

  expect(winningArea).toStrictEqual(true);
});

test('similarStrings() returns true, when provided two slightly different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const issue = new Issue({});

  const winningArea = issue['similarStrings'](
    '(aws-cognito) This is a title',
    '(aws-cognito) This is a'
  );

  expect(winningArea).toStrictEqual(true);
});

test('similarStrings() returns false, when provided two completely different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-cognito',
      keywords: ['cognito'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const issue = new Issue({});

  const winningArea = issue['similarStrings'](
    '(aws-cognito) This is a title',
    '(taco-truck) free tacos!'
  );

  expect(winningArea).toStrictEqual(false);
});

test('decideWinner will overwrite the winner if a higher score is found', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-s3',
      keywords: ['s3', 'bucket'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
    {
      area: 'aws-lambda',
      keywords: ['lambda', 'function'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const title = 'default title';
  const body = 'My bucket is being created inside a Lambda Function';
  const issue = new Issue({
    title,
    body,
  });

  const area = issue.determineArea();

  expect(area).toStrictEqual('aws-lambda');
});

test('Tiebreaker will go to area with more exact keyword matches', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: 'aws-s3',
      keywords: ['s3', 'bucket'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
    {
      area: 'aws-lambda',
      keywords: ['lambda', 'function'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  const title = 'default title';
  const body = 'My s3 bucket is being created inside a Lambda Functiom';
  const issue = new Issue({
    title,
    body,
  });

  const area = issue.determineArea();

  expect(area).toStrictEqual('aws-s3');
});

test('areaIsKeyword parameter uses area as keyword', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([
    {
      area: '@aws-cdk/aws-cognito',
      keywords: ['nokeywords'],
      labels: ['a', 'b', 'c'],
      assignees: ['d', 'e', 'f'],
    },
  ]);
  process.env['INPUT_AREA-IS-KEYWORD'] = 'true';
  const title = '(@aws-cdk/aws-cognito): This is a title';
  const body = '(This) is a body';
  const issue = new Issue({
    title,
    body,
  });

  const area = issue.determineArea();

  expect(area).toStrictEqual('@aws-cdk/aws-cognito');
});

test('verifyIssueLabels returns true, when included-labels are present', () => {
  const title = '(@aws-cdk/aws-cognito): This is a title';
  const body = '(This) is a body';
  const labels = ['needs-triage'];
  const issue = new Issue({
    title,
    body,
    labels,
  });

  const result = issue.verifyIssueLabels(['needs-triage'], ['']);

  expect(result).toStrictEqual(true);
});

test('verifyIssueLabels returns false, when excluded-labels are present', () => {
  const title = '(@aws-cdk/aws-cognito): This is a title';
  const body = '(This) is a body';
  const labels = ['p1'];
  const issue = new Issue({
    title,
    body,
    labels,
  });

  const result = issue.verifyIssueLabels([''], ['p1']);

  expect(result).toStrictEqual(false);
});

test('verifyIssueLabels returns false, when excluded-labels and included-labels are present', () => {
  const title = '(@aws-cdk/aws-cognito): This is a title';
  const body = '(This) is a body';
  const labels = ['p1', 'needs-triage'];
  const issue = new Issue({
    title,
    body,
    labels,
  });

  const result = issue.verifyIssueLabels(['needs-triage'], ['p1']);

  expect(result).toStrictEqual(false);
});

test('verifyIssueLabels returns true, when no labels are present on issue and no included-labels are specified', () => {
  const title = '(@aws-cdk/aws-cognito): This is a title';
  const body = '(This) is a body';
  const issue = new Issue({
    title,
    body,
  });

  const result = issue.verifyIssueLabels([''], ['']);

  expect(result).toStrictEqual(true);
});

test('verifyIssueLabels returns true, when no included-labels are specified and labels are present on issue', () => {
  const title = '(@aws-cdk/aws-cognito): This is a title';
  const body = '(This) is a body';
  const labels = ['needs-triage'];
  const issue = new Issue({
    title,
    body,
    labels,
  });

  const result = issue.verifyIssueLabels([''], ['p2']);

  expect(result).toStrictEqual(true);
});
