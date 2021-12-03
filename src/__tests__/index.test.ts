afterEach(() => {
  jest.resetAllMocks();
});

test('sets action as failed, if error is thrown', async () => {
  // Mock the GithubApi class to throw an error when initializing
  const mockedGithub = jest.fn();
  jest.mock('../github', () => {
    return {
      GithubApi: mockedGithub.mockImplementation(() => {
        throw new Error('mocked error');
      }),
    };
  });
  // Mock stdout so that we can verify the output
  const stdoutWrite = jest.spyOn(process.stdout, 'write');

  await require('../index');

  expect(mockedGithub).toHaveBeenCalled();
  expect(mockedGithub).toThrowError('mocked error');
  expect(stdoutWrite.mock.calls).toStrictEqual(
    expect.arrayContaining([
      expect.arrayContaining([
        expect.stringContaining('::error::mocked error'),
      ]),
    ])
  );
});
