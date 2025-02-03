const { Secret, ChatSecret } = require('secret-ai-js-sdk');

const messages = [
    ["system", "You are a helpful assistant that translates English to Spanish."],
    ["human", "I love programming."]
  ];
  
  // The ChatSecret constructor
  const secretAiLLM = new ChatSecret({
    apiKey: "YOUR-API-KEY",
  });
  
  // Invoke
  secretAiLLM.invoke(messages, { stream: false })
    .then(response => {
      console.log("LLM response:", response);
    })
    .catch(err => {
      console.error("Error:", err);
    });
  