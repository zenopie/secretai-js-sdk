# Secret AI JavaScript SDK

The Secret AI SDK provides a simple and convenient way to access Secret Confidential AI models. With this SDK, you can easily integrate Secret's AI capabilities into your own applications and services.

## Overview

The Secret AI SDK is a JavaScript library that enables access to Secret Confidential AI models. The SDK provides a simple and intuitive API that allows you to send requests to Secret's AI models and receive responses in a variety of formats.

## Features

- Access to Secret Confidential AI models
- Simple and intuitive API using JavaScript
- Built-in Axios HTTP client for request handling
- Tool binding support (ready for when models support it)
- Browser-compatible implementation

## Installation

To install the Secret AI SDK, you can use npm:

```sh
npm install secretai
```

## Usage

Here's an example of how to use the Secret AI SDK in JavaScript:

```javascript
import { ChatSecret, SECRET_AI_CONFIG } from "secretai";

const secretAI = new ChatSecret({
  apiKey: "YOUR-API-KEY",
  // Uses https://secretai1.scrtlabs.com:21434
  base_url: SECRET_AI_CONFIG.DEFAULT_LLM_URL,
  // Uses deepseek-r1:70b
  model: SECRET_AI_CONFIG.DEFAULT_LLM_MODEL,
  temperature: 1.0,
});

// Define messages to send to the AI
const messages = [
  { role: "system", content: "You are a helpful assistant that translates English to Spanish." },
  { role: "user", content: "I love programming." },
];

// Invoke the LLM
secretAI
  .chat(messages)
  .then((response) => {
    console.log("Response:", response);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

### Tool Binding Support

The SDK also provides a `ChatSecretTools` class that implements tool binding capabilities. Note that this functionality will be fully available once the Secret AI models support tool calling:

```javascript
import { ChatSecretTools } from "secretai";

// Create a new ChatSecretTools instance
const secretToolsAI = new ChatSecretTools({
  apiKey: "YOUR-API-KEY",
});

// Create and bind tools
const calculator = secretToolsAI.createTool(
  ({ a, b, operation }) => {
    switch (operation) {
      case "add":
        return a + b;
      case "subtract":
        return a - b;
      case "multiply":
        return a * b;
      case "divide":
        return a / b;
      default:
        throw new Error("Unknown operation");
    }
  },
  {
    name: "calculator",
    description: "Perform arithmetic operations on two numbers",
    schema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
        operation: {
          type: "string",
          enum: ["add", "subtract", "multiply", "divide"],
          description: "The arithmetic operation to perform",
        },
      },
      required: ["a", "b", "operation"],
    },
  }
);

// Bind the tool to the model
secretToolsAI.bindTools([calculator]);

// Use the tool-enabled model
const messages = [
  ["system", "You are a helpful math assistant."],
  ["human", "What is 123 * 456?"],
];

secretToolsAI
  .chat(messages)
  .then((response) => console.log(response))
  .catch((error) => console.error(error));
```

## API Methods

### `new ChatSecret(options)`

Creates a new instance of the chat client (browser-compatible).

#### Parameters:

- `apiKey` (string, required) - Your Secret AI API key.
- `base_url` (string, optional) - The base URL of the Secret AI endpoint. Defaults to `https://secretai1.scrtlabs.com:21434`.
- `model` (string, optional) - The model to use. Defaults to `deepseek-r1:70b`.
- `temperature` (number, optional) - Controls randomness. Defaults to `1.0`.

### `chat(messages, options)`

Sends a chat request to the Secret AI model.

#### Parameters:

- `messages` (array, required) - A list of messages in `{ role, content }` format.
- `options` (object, optional)
  - `stream` (boolean, default: `false`) - Whether to use streaming responses.

#### Returns:

- A Promise resolving to the AI response.

### `new ChatSecretTools(options)`

Creates a new instance of the tool-integrated chat client (for Node.js environments).

#### Parameters:

- Same as `ChatSecret`

### `bindTools(tools)`

Binds an array of tools to the model.

#### Parameters:

- `tools` (array, required) - An array of structured tools to bind to the model.

#### Returns:

- The `ChatSecretTools` instance for chaining.

### `addTool(tool)`

Adds a single tool to the model.

#### Parameters:

- `tool` (object, required) - A structured tool to add to the model.

#### Returns:

- The `ChatSecretTools` instance for chaining.

### `createTool(func, config)`

Creates a structured tool for function calling.

#### Parameters:

- `func` (function, required) - The function to execute when the tool is called.
- `config` (object, required) - Configuration for the tool:
  - `name` (string, required) - The name of the tool.
  - `description` (string, required) - A description of what the tool does.
  - `schema` (object, required) - A JSON Schema defining the tool's parameters.

#### Returns:

- A structured tool that can be bound to the model.

## API Documentation

For more information on the Secret AI SDK API, please see our [API documentation](https://docs.scrt.network/secret-network-documentation/secret-ai/sdk).

## License

The Secret AI SDK is licensed under the [MIT License](https://opensource.org/licenses/MIT).
