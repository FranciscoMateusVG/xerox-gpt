import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum
} from 'openai'

export class Message implements ChatCompletionRequestMessage {
  constructor(content: string, role: ChatCompletionRequestMessageRoleEnum) {
    this.content = content
    this.role = role
  }

  content?: string | undefined
  role: ChatCompletionRequestMessageRoleEnum
}
