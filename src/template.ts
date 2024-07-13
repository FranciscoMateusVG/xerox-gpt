export const defaultPromptTemplate = [
  'suggest 3 commit messages based on the following diff:',
  '{{diff}}',
  '',
  'commit messages should:',
  ' - follow conventional commits',
  ' - message format should be: <type>[scope]: <description>',
  ' - minimum length of message is 90 characters all in one line',
  '',
  'examples:',
  ' - fix(authentication): add password regex pattern',
  ' - feat(storage): add new test cases'
].join('\n')
