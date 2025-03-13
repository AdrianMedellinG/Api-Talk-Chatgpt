const fetch = require('node-fetch');
const { Configuration, OpenAIApi } = require('openai');

class ApiTalkChatGPT {
  /**
   * Initializes the QueryAssistant module.
   * @param {Object} config - Configuration object.
   * @param {string} config.openAIApiKey - OpenAI API Key.
   * @param {string} [config.model="gpt-4"] - OpenAI model to use.
   * @param {number} [config.maxTokens=200] - Maximum tokens for responses.
   */
  constructor({ openAIApiKey, model = "gpt-4", maxTokens = 200 }) {
    if (!openAIApiKey) {
      throw new Error("You must provide an OpenAI API Key.");
    }
    if (!model) {
      throw new Error("You must specify an OpenAI model.");
    }
    if (!maxTokens || typeof maxTokens !== "number") {
      throw new Error("You must specify maxTokens as a number.");
    }

    this.openai = new OpenAIApi(new Configuration({ apiKey: openAIApiKey }));
    this.model = model;
    this.maxTokens = maxTokens;
  }

  /**
   * Processes a user query, selects the appropriate endpoint, fetches data, and formats the response.
   * @param {string} query - User query.
   * @param {Array} endpoints - List of available endpoints.
   * @param {Array} [messages=[]] - Custom conversation context for OpenAI.
   * @param {string} [language="en"] - Preferred language for response (e.g., "en", "es", "fr").
   * @returns {Promise<string>} - Response in a human-readable format.
   */
  async getResponse(query, endpoints, messages = [], language = "en") {
    if (!query || !Array.isArray(endpoints) || endpoints.length === 0) {
      throw new Error("You must provide a query and a valid list of endpoints.");
    }

    try {
      // 1️⃣ Determine the most relevant endpoint
      const prompt = `I have the following available endpoints:
      ${endpoints
        .map(e => `- ${e.name}: ${e.description}
          Common questions: ${e.examples.join(", ")}
          Expected response example: ${JSON.stringify(e.responseExample)}`)
        .join("\n\n")}

      Based on the following user query, select the most relevant endpoint: "${query}". 
      Return only the exact name of the endpoint, without explanation.`;

      const endpointResponse = await this.openai.createChatCompletion({
        model: this.model,
        messages: [{ role: 'system', content: 'You are an assistant that selects the best endpoint based on queries and response examples.' }, ...messages, { role: 'user', content: prompt }],
        max_tokens: 50,
      });

      const selectedEndpointName = endpointResponse.data.choices[0].message.content.trim();
      const selectedEndpoint = endpoints.find(e => e.name.toLowerCase() === selectedEndpointName.toLowerCase());

      if (!selectedEndpoint) {
        throw new Error("No suitable endpoint found for the query.");
      }

      console.log(`📌 Selected endpoint: ${selectedEndpoint.name}`);

      // 2️⃣ Fetch data from the selected endpoint
      const response = await fetch(selectedEndpoint.url);
      const data = await response.json();

      // Ensure data format is wrapped inside `data: []`
      const formattedData = { data: Array.isArray(data) ? data : [data] };

      // 3️⃣ Generate a human-readable response with OpenAI
      const finalPrompt = `The following data was retrieved from the ${selectedEndpoint.name} endpoint:
      ${JSON.stringify(formattedData)}

      Please format the response in a clear, human-readable way in ${language}. 
      Example:
      - If language is 'en': 'There are X orders pending. The last order was placed by John Doe for $150.50 and is currently shipped.'
      - If language is 'es': 'Hay X pedidos pendientes. El último pedido fue realizado por John Doe por $150.50 y actualmente está enviado.'
      
      Generate a similar response using the retrieved data.`;

      const finalResponse = await this.openai.createChatCompletion({
        model: this.model,
        messages: [{ role: 'system', content: 'You are an assistant that formats responses based on database queries into natural language.' }, ...messages, { role: 'user', content: finalPrompt }],
        max_tokens: this.maxTokens,
      });

      return finalResponse.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error in getResponse:', error.message);
      return "An error occurred while processing your request. Please try again later.";
    }
  }
}

module.exports = ApiTalkChatGPT;