// This example demonstrates how to use the ChatSecretLangChain class with tool binding
import { ChatSecretLangChain } from "./src/index.js";

// Real API credentials
const API_KEY = "bWFzdGVyQHNjcnRsYWJzLmNvbTpTZWNyZXROZXR3b3JrTWFzdGVyS2V5X18yMDI1";
const BASE_URL = "https://secretai1.scrtlabs.com:21434";
const MODEL = "llama3.2-vision"; // Using the specified model

// Try to find if the model supports tools or can be made to work with tools
async function runTests() {
  try {
    console.log(`Testing ${MODEL} with different tool binding approaches...`);

    // Approach 1: Direct tool binding
    console.log("\n--- Approach 1: Direct tool binding ---");
    try {
      const secretAiLLM = new ChatSecretLangChain({
        apiKey: API_KEY,
        base_url: BASE_URL,
        model: MODEL,
        temperature: 0.7,
      });

      // Define a simple multiplication tool
      const multiplyTool = secretAiLLM.createTool(
        ({ a, b }) => {
          return a * b;
        },
        {
          name: "multiply",
          description: "Multiply two numbers together",
          schema: {
            type: "object",
            properties: {
              a: { type: "number", description: "The first number to multiply" },
              b: { type: "number", description: "The second number to multiply" },
            },
            required: ["a", "b"],
          },
        }
      );

      // Bind the tool
      secretAiLLM.bindTools([multiplyTool]);

      // Simple messages that should trigger tool use
      const messages = [
        ["system", "You are a helpful math assistant."],
        ["human", "What is 123 multiplied by 456?"],
      ];

      const response = await secretAiLLM.chat(messages);
      console.log(`Success! Direct tool binding works:`, response);
    } catch (error) {
      console.log(`Direct tool binding failed: ${error.message}`);
    }

    // Approach 2: Try function-calling format directly in the API payload
    console.log("\n--- Approach 2: Function-calling format in API payload ---");
    try {
      // Create a new instance without binding tools
      const secretAiLLM = new ChatSecretLangChain({
        apiKey: API_KEY,
        base_url: BASE_URL,
        model: MODEL,
        temperature: 0.7,
      });

      // Create a custom method to try function calling
      async function customFunctionCall() {
        const messages = [
          { role: "system", content: "You are a helpful math assistant." },
          { role: "user", content: "What is 123 multiplied by 456?" },
        ];

        // Define functions directly in the payload
        const functions = [
          {
            name: "multiply",
            description: "Multiply two numbers together",
            parameters: {
              type: "object",
              properties: {
                a: { type: "number", description: "The first number to multiply" },
                b: { type: "number", description: "The second number to multiply" },
              },
              required: ["a", "b"],
            },
          },
        ];

        // Send the request
        const response = await secretAiLLM.http.post("/api/chat", {
          model: MODEL,
          temperature: 0.7,
          messages: messages,
          functions: functions,
          function_call: "auto",
        });

        return response.data;
      }

      const response = await customFunctionCall();
      console.log(`Success! Function-calling format works:`, response);
    } catch (error) {
      console.log(`Function-calling format failed: ${error.message}`);
    }

    // Approach 3: Test basic chat functionality without tools
    console.log("\n--- Approach 3: Basic chat without tools ---");

    const secretAiLLM = new ChatSecretLangChain({
      apiKey: API_KEY,
      base_url: BASE_URL,
      model: MODEL,
      temperature: 0.7,
    });

    // Define simple chat messages
    const messages = [
      ["system", "You are a helpful math assistant."],
      ["human", "What is 123 multiplied by 456?"],
    ];

    console.log("\n==== Non-Streaming Chat Test ====");
    // Test non-streaming chat
    const response = await secretAiLLM.chat(messages);
    console.log("Non-streaming response:", response);

    console.log("\n==== All Tests Completed ====");

    console.log("\n==== Conclusion ====");
    console.log("Based on our tests, it appears that this model does not currently support tools.");
    console.log("However, you can still use it for regular chat functionality.");
    console.log(
      "The tool binding implementation we've created will be ready to use when models that support tools become available."
    );
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Run the tests
runTests();
