import axios from 'axios';
import { DEFAULT_LLM_URL, DEFAULT_LLM_MODEL } from './config.js';
import { SecretAIError, SecretAINetworkError } from './utils/errors.js';

/**
 * ChatSecret Class - Manages chat interactions with the LLM.
 */
export class ChatSecret {
  constructor({ base_url, model, temperature, apiKey, stream }) {
    if (!apiKey) throw new SecretAIError('API key is required.');

    this.apiKey = apiKey;
    this.baseUrl = base_url || DEFAULT_LLM_URL;
    this.model = model || DEFAULT_LLM_MODEL;
    this.temperature = temperature !== undefined ? temperature : 1.0;
    this.stream = stream || false; // ✅ Default to false if undefined

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  async chat(messages, options = {}) {
    if (!Array.isArray(messages)) throw new SecretAIError('messages must be an array.');

    // Use instance-level stream setting, but allow override via options
    const stream = options.stream !== undefined ? options.stream : this.stream;

    // 🔹 Ensure messages are in correct format: { role, content }
    const formattedMessages = messages.map(msg => {
      if (Array.isArray(msg) && msg.length === 2) {
        return { role: msg[0], content: msg[1] };  // ✅ Convert ["role", "message"] → { role, content }
      }
      if (typeof msg === 'object' && msg.role && msg.content) {
        return msg;  // ✅ Already correct format
      }
      throw new SecretAIError('Invalid message format.');
    });

    try {
      const response = await this.http.post('/api/chat', {
        model: this.model,
        temperature: this.temperature,
        messages: formattedMessages,
        stream  // ✅ Uses either instance-level stream or method override
      });

      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    if (error.response) {
      throw new SecretAINetworkError(`Request failed [${error.response.status}]: ${error.response.data}`);
    } else if (error.request) {
      throw new SecretAINetworkError('No response received from server.');
    } else {
      throw new SecretAIError(`Unexpected error: ${error.message}`);
    }
  }
}
