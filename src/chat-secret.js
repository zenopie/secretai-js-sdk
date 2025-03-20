import axios from 'axios';
import { DEFAULT_LLM_URL, DEFAULT_LLM_MODEL } from './config.js';
import { SecretAIError, SecretAINetworkError } from './utils/errors.js';

/**
 * ChatSecret Class - Manages chat interactions with the LLM.
 */
export class ChatSecret {
  constructor({ base_url, model, temperature, apiKey, stream, signal }) {
    if (!apiKey) throw new SecretAIError('API key is required.');

    this.apiKey = apiKey;
    this.baseUrl = base_url || DEFAULT_LLM_URL;
    this.model = model || DEFAULT_LLM_MODEL;
    this.temperature = temperature !== undefined ? temperature : 1.0;
    this.stream = stream || false;
    this.signal = signal; // For AbortController support

    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      signal: this.signal, // Pass AbortController signal to axios
    });
  }

  async chat(messages, callbacks = {}) {
    if (!Array.isArray(messages)) throw new SecretAIError('messages must be an array.');

    const formattedMessages = await Promise.all(messages.map(async msg => {
      if (Array.isArray(msg) && msg.length === 2) {
        return { role: msg[0], content: msg[1] };
      }
      if (typeof msg === 'object' && msg.role && msg.content) {
        if (msg.images) {
          const processedImages = this._processImages(msg.images);
          return { role: msg.role, content: msg.content, images: processedImages };
        }
        return { role: msg.role, content: msg.content };
      }
      throw new SecretAIError('Invalid message format.');
    }));

    if (this.stream) {
      return this._chatStreaming(formattedMessages, callbacks);
    } else {
      return this._chatNonStreaming(formattedMessages);
    }
  }

  _processImages(images) {
    if (!Array.isArray(images)) throw new SecretAIError('images must be an array.');

    images.forEach(image => {
      if (typeof image !== 'string') {
        throw new SecretAIError('Each image must be a string (raw base64 expected).');
      }
    });

    return images; // Return the array of strings unchanged
  }

  async _chatNonStreaming(messages) {
    try {
      const response = await this.http.post('/api/chat', {
        model: this.model,
        temperature: this.temperature,
        messages,
        stream: false,
      });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async _chatStreaming(messages, { onMessage, onStart, onComplete, onError }) {
    try {
      console.log("SDK sending request:", JSON.stringify({
        model: this.model,
        temperature: this.temperature,
        messages,
        stream: true,
      }, null, 2));
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          temperature: this.temperature,
          messages,
          stream: true,
        }),
        signal: this.signal, // Pass AbortController signal to fetch
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      if (onStart) onStart();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        try {
          const jsonMessages = chunk.trim().split("\n").map((line) => JSON.parse(line));

          for (const json of jsonMessages) {
            if (json.message && json.message.content) {
              if (onMessage) onMessage(json);
            }
          }
        } catch (parseError) {
          console.error("⚠️ Failed to parse streamed chunk:", chunk, parseError);
        }
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error("🚨 Streaming error:", error);
      if (onError) onError(error);
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