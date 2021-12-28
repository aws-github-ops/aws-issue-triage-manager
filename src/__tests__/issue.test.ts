import { Issue } from '../issue';

test('removes excluded characters from title, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  const content = ['(aws-cognito): This is a title'];

  const issue = new Issue(content);

  expect(issue['titleIssueWords']).toStrictEqual(["", "aws-cognito", ":", "This", "is", "a", "title"]);
});

test('removes excluded characters from body, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  const content = ['(aws-cognito): This is a title', '(This) is a body'];

  const issue = new Issue(content);

  expect(issue['bodyIssueWords']).toStrictEqual(["", "This", "", "is", "a", "body"]);
});

test('sets parameters, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
  }]);
  const content = ['(aws-cognito): This is a title', '(This) is a body'];

  const issue = new Issue(content);

  expect(issue.parameters).toStrictEqual([{
    area: 'aws-cognito',
    keywords: ['cognito'],
  }]);
});

test('sets defaultArea, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  process.env['INPUT_DEFAULT-AREA'] = JSON.stringify({
    labels: ['a', 'b', 'c'],
    assignees: ['d', 'e', 'f'],
  });
  const content = ['(aws-cognito): This is a title', '(This) is a body'];

  const issue = new Issue(content);

  expect(issue.defaultArea).toStrictEqual({
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  });
})

test('sets similarity, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  process.env.INPUT_SIMILARITY = '0.72';
  const content = ['(aws-cognito): This is a title', '(This) is a body'];

  const issue = new Issue(content);

  expect(issue['similarity']).toStrictEqual(0.72);
});

test('sets bodyValue, when initialized', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{}]);
  process.env['INPUT_BODY-VALUE'] = '0.34';
  const content = ['(aws-cognito): This is a title', '(This) is a body'];

  const issue = new Issue(content);

  expect(issue['bodyValue']).toStrictEqual(0.34);
})

test('determineArea() returns aws-cognito, when provided cognito parameters and content', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const content = ['(aws-cognito): This is a title'];
  const issue = new Issue(content);

  const winningArea = issue.determineArea();

  expect(winningArea).toStrictEqual('aws-cognito');
});

test('getWinningAreaData() returns expected area data, when provided the winning area', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const content = ['(aws-cognito): This is a title'];
  const issue = new Issue(content);
  const winningArea = issue.determineArea();

  const winningAreaData = issue.getWinningAreaData(winningArea);

  expect(winningAreaData).toStrictEqual({
    area: "aws-cognito",
    assignees: ["d", "e", "f"],
    keywords: ["cognito"],
    labels: ["a", "b", "c"]
  });
});

test('scoreArea() returns a map containing one area, when provided a single entry', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';
  const content = [title, body];
  const issue = new Issue(content);

  const winningArea = issue['scoreArea']('aws-cognito', new Map(), title);

  expect(winningArea).toStrictEqual(new Map([
    ['aws-cognito', title]
  ]));
});

test('decideWinner() returns aws-cognito, when provided a map with a single entry', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const title = '(aws-cognito): This is a title';
  const body = '(This) is a body';
  const content = [title, body];
  const issue = new Issue(content);

  const winningArea = issue['decideWinner'](new Map([
    ['aws-cognito', 0.78]
  ]));

  expect(winningArea).toStrictEqual('aws-cognito');
});

test('isSimilar() returns 20.52, when provided two slightly different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const issue = new Issue([]);

  const winningArea = issue['isSimilar'](
    '(aws-cognito) This is a title',
    '(aws-cognto) This is a title',
  );

  expect(winningArea).toStrictEqual(20.52);
});

test('isSimilar() returns 20.88, when provided two identical strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const issue = new Issue([]);

  const winningArea = issue['isSimilar'](
    '(aws-cognito) This is a title',
    '(aws-cognito) This is a title',
  );

  expect(winningArea).toStrictEqual(20.88);
});

test('isSimilar() returns 19.08, when provided two completely different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const issue = new Issue([]);

  const winningArea = issue['isSimilar'](
    '(aws-cognito) This is a title',
    '(taco-truck) free tacos!',
  );

  expect(winningArea).toStrictEqual(19.08);
});

test('similarStrings() returns true, when provided two identical strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const issue = new Issue([]);

  const winningArea = issue['similarStrings'](
    '(aws-cognito) This is a title',
    '(aws-cognito) This is a title',
  );

  expect(winningArea).toStrictEqual(true);
});

test('similarStrings() returns true, when provided two slightly different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const issue = new Issue([]);

  const winningArea = issue['similarStrings'](
    '(aws-cognito) This is a title',
    '(aws-cognito) This is a',
  );

  expect(winningArea).toStrictEqual(true);
});

test('similarStrings() returns false, when provided two completely different strings', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: 'aws-cognito',
    keywords: ['cognito'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);
  const issue = new Issue([]);

  const winningArea = issue['similarStrings'](
    '(aws-cognito) This is a title',
    '(taco-truck) free tacos!',
  );

  expect(winningArea).toStrictEqual(false);
});

test('areaIsKeyword parameter uses area as keyword', () => {
  process.env.INPUT_PARAMETERS = JSON.stringify([{
    area: '@aws-cdk/aws-cognito',
    keywords: ['nokeywords'],
    labels: ["a", "b", "c"],
    assignees: ["d", "e", "f"],
  }]);

  process.env['INPUT_AREA-IS-KEYWORD'] = 'true';

  const content = ['(@aws-cdk/aws-cognito): This is a title', '(This) is a body'];

  const issue = new Issue(content);
  const area = issue.determineArea();

  expect(area).toStrictEqual('@aws-cdk/aws-cognito');
});
