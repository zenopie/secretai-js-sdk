// src/utils/errors.js
export class SecretAIError extends Error {
    constructor(message) {
      super(message);
      this.name = 'SecretAIError';
    }
  }
  
  export class SecretAINetworkError extends SecretAIError {
    constructor(message) {
      super(message);
      this.name = 'SecretAINetworkError';
    }
  }
  