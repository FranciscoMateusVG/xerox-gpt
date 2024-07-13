import enquirer from 'enquirer'
import ora from 'ora'

import { execSync } from 'child_process'

import { loadPromptTemplate } from './config_storage.js'
import { ChatGPTClient } from './openAiClient.js'

const debug = (...args: unknown[]) => {
  if (process.env.DEBUG) {
    console.debug(...args)
  }
}

const CUSTOM_MESSAGE_OPTION = '[write own message]...'
const spinner = ora()

let diff = ''
try {
  diff = execSync('git diff --cached').toString()
  if (!diff) {
    console.log('No changes to commit.')
    process.exit(0)
  }
} catch (e) {
  console.log('Failed to run git diff --cached')
  process.exit(1)
}

run(diff)
  .then(() => {
    process.exit(0)
  })
  .catch((e: any) => {
    console.log('Error: ' + e.message, e.cause ?? '')
    process.exit(1)
  })

async function run(diff: string) {
  // TODO: we should use a good tokenizer here
  const diffTokens = diff.split(' ').length
  if (diffTokens > 5000) {
    console.log(`Diff is way too bug. Truncating to 5000 tokens. It may help`)
    diff = diff.split(' ').slice(0, 5000).join(' ')
  }

  const api = new ChatGPTClient()

  const prompt = loadPromptTemplate().replace(
    '{{diff}}',
    ['```', diff, '```'].join('\n')
  )

  while (true) {
    debug('prompt: ', prompt)
    const choices = await getMessages(api, prompt)

    try {
      const answer = await enquirer.prompt<{ message: string }>({
        type: 'select',
        name: 'message',
        message: 'Pick a message',
        choices
      })

      Bun.spawnSync([
        'git',
        'commit',
        '-m',
        escapeCommitMessage(answer.message)
      ])

      const needPullDescription = await enquirer.prompt<{ needPR: boolean }>({
        type: 'confirm',
        name: 'needPR',
        message: 'Do you want to create a Pull Description?'
      })

      if (needPullDescription.needPR) {
        spinner.start('Asking ChatGPT 🤖 for a Pull Description...')
        const request =
          'Write a Pull Description based on the diff and the commit, dont forget to include a title and summary:\n\n' +
          answer.message

        const pullDescription = await api.getAnswer(request)
        spinner.stop()
        console.log(pullDescription)
      }

      return
    } catch (e) {
      console.log('Aborted.')
      console.log(e)
      process.exit(1)
    }
  }
}

async function getMessages(api: ChatGPTClient, request: string) {
  spinner.start('Asking ChatGPT 🤖 for commit messages...')

  // send a message and wait for the response
  try {
    const response = await api.getAnswer(request)
    // find json array of strings in the response
    const messages = response
      .split('\n')
      .map(normalizeMessage)
      .filter((l) => l.length > 1)

    spinner.stop()

    debug('response: ', response)

    return messages
  } catch (e: any) {
    spinner.stop()
    if (e.message === 'Unauthorized') {
      return getMessages(api, request)
    } else {
      throw e
    }
  }
}

function normalizeMessage(line: string) {
  return line
    .trim()
    .replace(/^(\d+\.|-|\*)\s+/, '')
    .replace(/^[`"']/, '')
    .replace(/[`"']$/, '')
    .replace(/[`"']:/, ':') // sometimes it formats messages like this: `feat`: message
    .replace(/:[`"']/, ':') // sometimes it formats messages like this: `feat:` message
    .replace(/\\n/g, '')
    .trim()
}

function escapeCommitMessage(message: string) {
  return message.replace(/'/, `''`)
}
