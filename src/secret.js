// src/secret.js
import axios from 'axios';
import { SecretAIError, SecretAINetworkError } from './utils/errors.js';

/**
 * Secret Class (like in Python) - Interacts with the Secret worker management contract.
 */
export class Secret {
  constructor(apiKey, serviceUrl = 'https://some-secret-service.example.com') {
    if (!apiKey) throw new SecretAIError('API key is required.');
    this.apiKey = apiKey;
    this.serviceUrl = serviceUrl;

    this.http = axios.create({
      baseURL: this.serviceUrl,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` }
    });
  }

  async getModels() {
    try {
      const response = await this.http.get('/models');
      return response.data.models;
    } catch (error) {
      this._handleError(error);
    }
  }

  async getUrls(model) {
    if (!model) throw new SecretAIError('Model is required.');
    try {
      const response = await this.http.get(`/models/${model}/urls`);
      return response.data.urls;
    } catch (error) {
      this._handleError(error);
    }
  }

  _handleError(error) {
    if (error.response) {
      throw new SecretAINetworkError(`Request failed [${error.response.status}]: ${error.response.data}`);
    } else if (error.request) {
      throw new SecretAINetworkError('No response from server.');
    } else {
      throw new SecretAIError(`Unexpected error: ${error.message}`);
    }
  }
}
