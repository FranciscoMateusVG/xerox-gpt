import { Configuration, OpenAIApi } from 'openai'
import { getApiKey, getPromptOptions } from './config.js'
import { Message } from './types.js'

const trackConversation: Message[] = []

export class ChatGPTClient {
  async getAnswer(question: string): Promise<string> {
    const { maxTokens, temperature } = await getPromptOptions()
    const configuration = new Configuration({
      apiKey: await getApiKey()
    })
    const openai = new OpenAIApi(configuration)
    const model = 'gpt-4o'

    try {
      trackConversation.push(new Message(question, 'user'))
      const result = await openai.createChatCompletion({
        model,
        messages: trackConversation,
        max_tokens: maxTokens,
        temperature
      })

      const text = result.data.choices[0].message?.content
      const message = result.data.choices[0].message
      if (text === undefined || message === undefined) {
        throw new Error('No text found in response.')
      }
      trackConversation.push(message)
      return text
    } catch (e: any) {
      console.error(e?.response ?? e)
      throw e
    }
  }
}
