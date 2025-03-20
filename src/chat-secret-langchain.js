import axios from "axios";
import { DEFAULT_LLM_URL, DEFAULT_LLM_MODEL } from "./config.js";
import { SecretAIError, SecretAINetworkError } from "./utils/errors.js";

/**
 * ChatSecretLangChain Class - Manages chat interactions with the LLM using LangChain concepts.
 * This implementation adds support for tool binding and is intended for Node.js environments.
 */
export class ChatSecretLangChain {
  constructor({ base_url, model, temperature, apiKey, stream }) {
    if (!apiKey) throw new SecretAIError("API key is required.");

    this.apiKey = apiKey;
    this.baseUrl = base_url || DEFAULT_LLM_URL;
    this.model = model || DEFAULT_LLM_MODEL;
    this.temperature = temperature !== undefined ? temperature : 1.0;
    this.stream = stream || false;
    this.tools = [];

    // Initialize HTTP client
    this.http = axios.create({
      baseURL: this.baseUrl,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
    });
  }

  /**
   * Binds tools to the model for function calling capabilities
   * @param {Array} tools - Array of tools to bind to the model
   * @returns {ChatSecretLangChain} - Returns the instance for chaining
   */
  bindTools(tools) {
    if (!Array.isArray(tools)) {
      throw new SecretAIError("Tools must be an array.");
    }

    this.tools = tools;

    return this;
  }

  /**
   * Add a single tool to the model
   * @param {Object} tool - Tool to add to the model
   * @returns {ChatSecretLangChain} - Returns the instance for chaining
   */
  addTool(tool) {
    if (!tool) {
      throw new SecretAIError("Tool is required.");
    }

    // Add to local tools array
    this.tools.push(tool);

    return this;
  }

  /**
   * Create a structured tool for LangChain
   * @param {Function} func - The function to execute
   * @param {Object} config - Configuration for the tool
   * @returns {StructuredTool} - Returns a LangChain StructuredTool
   */
  createTool(func, config) {
    return {
      name: config.name,
      description: config.description,
      schema: config.schema,
      func: func,
      // Handle tool execution
      call: async (args) => {
        try {
          return await func(args);
        } catch (error) {
          throw new Error(`Error executing tool ${config.name}: ${error.message}`);
        }
      },
    };
  }

  /**
   * Find a tool by name
   * @param {string} name - Name of the tool to find
   * @returns {Object|null} - Returns the tool or null if not found
   */
  findTool(name) {
    return this.tools.find((tool) => tool.name === name) || null;
  }

  /**
   * Execute a tool call
   * @param {Object} toolCall - The tool call object
   * @returns {Promise<any>} - Promise resolving to the tool result
   */
  async executeTool(toolCall) {
    try {
      const { name, arguments: argsString } = toolCall.function;
      const tool = this.findTool(name);

      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      const args = JSON.parse(argsString);
      const result = await tool.call(args);

      return result;
    } catch (error) {
      throw new Error(`Error executing tool: ${error.message}`);
    }
  }

  /**
   * Convert tools to the format expected by the API
   * @returns {Array} - Array of formatted tools
   */
  formatToolsForAPI() {
    return this.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      },
    }));
  }

  /**
   * Send a chat request using LangChain
   * @param {Array} messages - Messages to send to the model
   * @param {Object} callbacks - Callbacks for streaming
   * @returns {Promise} - Promise resolving to the response
   */
  async chat(messages, callbacks = {}) {
    if (!Array.isArray(messages)) throw new SecretAIError("messages must be an array.");

    // Format messages for API
    const formattedMessages = messages.map((msg) => {
      if (Array.isArray(msg) && msg.length === 2) {
        return { role: msg[0], content: msg[1] };
      }
      if (typeof msg === "object" && msg.role && msg.content) {
        return msg;
      }
      throw new SecretAIError("Invalid message format.");
    });

    // Enable streaming if specified in the callbacks
    const streamEnabled = callbacks.stream === true || this.stream;

    if (streamEnabled) {
      return this._chatStreaming(formattedMessages, callbacks);
    } else {
      return this._chatNonStreaming(formattedMessages);
    }
  }

  /**
   * Send a non-streaming chat request
   * @param {Array} messages - Formatted messages to send
   * @returns {Promise} - Promise resolving to the response
   */
  async _chatNonStreaming(messages) {
    try {
      const payload = {
        model: this.model,
        temperature: this.temperature,
        messages,
        stream: false,
      };

      // Add tools if available
      if (this.tools.length > 0) {
        payload.tools = this.formatToolsForAPI();
        payload.tool_choice = "auto";
      }

      const response = await this.http.post("/api/chat", payload);

      // Handle tool calls in the response
      const responseData = response.data;

      if (responseData.tool_calls && responseData.tool_calls.length > 0) {
        // Execute tools and append results to messages
        for (const toolCall of responseData.tool_calls) {
          try {
            const toolResult = await this.executeTool(toolCall);

            // Add tool call and result to messages
            messages.push({
              role: "assistant",
              content: null,
              tool_calls: [toolCall],
            });

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          } catch (error) {
            console.error("Tool execution error:", error);
          }
        }

        // Make a follow-up request with tool results
        return this._chatNonStreaming(messages);
      }

      return responseData;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Send a streaming chat request
   * @param {Array} messages - Formatted messages to send
   * @param {Object} callbacks - Callbacks for streaming
   * @returns {Promise} - Promise resolving to the response
   */
  async _chatStreaming(messages, { onMessage, onStart, onComplete, onError }) {
    try {
      const payload = {
        model: this.model,
        temperature: this.temperature,
        messages,
        stream: true,
      };

      // Add tools if available
      if (this.tools.length > 0) {
        payload.tools = this.formatToolsForAPI();
        payload.tool_choice = "auto";
      }

      if (onStart) onStart();

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let toolCalls = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        try {
          const jsonMessages = chunk
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line));

          for (const json of jsonMessages) {
            if (json.message) {
              // Handle content
              if (json.message.content) {
                fullContent += json.message.content;
                if (onMessage) onMessage({ message: { content: json.message.content } });
              }

              // Handle tool calls
              if (json.message.tool_calls) {
                toolCalls = json.message.tool_calls;
                if (onMessage) onMessage({ message: { tool_calls: json.message.tool_calls } });
              }
            }
          }
        } catch (parseError) {
          console.error("Failed to parse streamed chunk:", chunk, parseError);
        }
      }

      // Handle tool execution after streaming is complete
      if (toolCalls.length > 0) {
        // Execute tools and append results to messages
        for (const toolCall of toolCalls) {
          try {
            const toolResult = await this.executeTool(toolCall);

            // Add tool call and result to messages
            messages.push({
              role: "assistant",
              content: null,
              tool_calls: [toolCall],
            });

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });

            if (onMessage) {
              onMessage({
                message: {
                  role: "tool",
                  content: `Tool result: ${JSON.stringify(toolResult)}`,
                },
              });
            }
          } catch (error) {
            console.error("Tool execution error:", error);
          }
        }

        // Make a follow-up request with tool results
        const followUpResponse = await this._chatNonStreaming(messages);
        fullContent += "\n" + followUpResponse.content;
      }

      if (onComplete) onComplete();

      return { content: fullContent };
    } catch (error) {
      console.error("Streaming error:", error);
      if (onError) onError(error);
      this._handleError(error);
    }
  }

  /**
   * Handle errors from the API
   * @param {Error} error - Error to handle
   * @throws {SecretAINetworkError|SecretAIError} - Throws appropriate error
   */
  _handleError(error) {
    if (error.response) {
      throw new SecretAINetworkError(
        `Request failed [${error.response.status}]: ${JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      throw new SecretAINetworkError("No response received from server.");
    } else {
      throw new SecretAIError(`Unexpected error: ${error.message}`);
    }
  }
}
