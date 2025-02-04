# Secret AI JavaScript SDK

The Secret AI SDK provides a simple and convenient way to access Secret Confidential AI models. With this SDK, you can easily integrate Secret's AI capabilities into your own applications and services.

## Overview

The Secret AI SDK is a JavaScript library that enables access to Secret Confidential AI models. The SDK provides a simple and intuitive API that allows you to send requests to Secret's AI models and receive responses in a variety of formats.

## Features

- Access to Secret Confidential AI models
- Simple and intuitive API using JavaScript
- Built-in Axios HTTP client for request handling

## Installation

To install the Secret AI SDK, you can use npm:

```sh
npm install secretai
```

## Usage

Here's an example of how to use the Secret AI SDK in JavaScript:

```javascript
import { ChatSecret, SECRET_AI_CONFIG } from 'secretai';

const secretAI = new ChatSecret({
    apiKey: 'YOUR-API-KEY',
    base_url: SECRET_AI_CONFIG.DEFAULT_LLM_URL,
    model: SECRET_AI_CONFIG.DEFAULT_LLM_MODEL,
    temperature: 1.0
});

// Define messages to send to the AI
const messages = [
    { role: 'system', content: 'You are a helpful assistant that translates English to Spanish.' },
    { role: 'user', content: 'I love programming.' }
];

// Invoke the LLM
secretAI.chat(messages).then(response => {
    console.log('Response:', response);
}).catch(error => {
    console.error('Error:', error);
});
```

## API Methods

### `new ChatSecret(options)`

Creates a new instance of the chat client.

#### Parameters:

- `apiKey` (string, required) - Your Secret AI API key.
- `base_url` (string, optional) - The base URL of the Secret AI endpoint. Defaults to `https://ai1.scrtlabs.com:21434`.
- `model` (string, optional) - The model to use. Defaults to `llama3.1:70b`.
- `temperature` (number, optional) - Controls randomness. Defaults to `1.0`.

### `chat(messages, options)`

Sends a chat request to the Secret AI model.

#### Parameters:

- `messages` (array, required) - A list of messages in `{ role, content }` format.
- `options` (object, optional)
  - `stream` (boolean, default: `false`) - Whether to use streaming responses.

#### Returns:

- A Promise resolving to the AI response.

## API Documentation

For more information on the Secret AI SDK API, please see our [API documentation](https://docs.scrt.network/secret-network-documentation/secret-ai/sdk).

## License

The Secret AI SDK is licensed under the [MIT License](https://opensource.org/licenses/MIT).
