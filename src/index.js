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
   * It also supports a chain of endpoints: after retrieving data from the primary endpoint,
   * if a `chain` property is defined, it will perform a second API call (e.g. to fetch product price).
   *
   * @param {string} query - User query.
   * @param {Array} endpoints - List of available endpoints.
   * @param {Array} [messages=[]] - Custom conversation context for OpenAI.
   * @param {string} [language="en"] - Preferred language for response (e.g., "en", "es", "fr").
   * @param {Object} [options={}] - Additional options to override default configuration.
   * @param {string} [options.model] - Override model to use.
   * @param {number} [options.maxTokens] - Override max tokens for responses.
   * @returns {Promise<string>} - Response in a human-readable format.
   */
  async getResponse(query, endpoints, messages = [], language = "en", options = {}) {
    if (!query || !Array.isArray(endpoints) || endpoints.length === 0) {
      throw new Error("You must provide a query and a valid list of endpoints.");
    }
    
    // Override model and maxTokens if provided in options
    const model = options.model || this.model;
    const maxTokens = options.maxTokens || this.maxTokens;

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
        model: model,
        messages: [
          { role: 'system', content: 'You are an assistant that selects the best endpoint based on queries and response examples.' },
          ...messages,
          { role: 'user', content: prompt }
        ],
        max_tokens: 50,
      });

      const selectedEndpointName = endpointResponse.data.choices[0].message.content.trim();
      const selectedEndpoint = endpoints.find(e => e.name.toLowerCase() === selectedEndpointName.toLowerCase());

      if (!selectedEndpoint) {
        throw new Error("No suitable endpoint found for the query.");
      }

      console.log(`📌 Selected endpoint: ${selectedEndpoint.name}`);

      // 2️⃣ Prepare the primary API request: method, headers, query parameters, and body (if provided)
      let url = selectedEndpoint.url;
      if (selectedEndpoint.query && typeof selectedEndpoint.query === 'object') {
        const qs = new URLSearchParams(selectedEndpoint.query);
        url += (url.includes('?') ? '&' : '?') + qs.toString();
      }

      const requestOptions = {
        method: selectedEndpoint.method || 'GET',
        headers: selectedEndpoint.headers || {}
      };

      if (selectedEndpoint.body && requestOptions.method.toUpperCase() !== 'GET') {
        requestOptions.headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(selectedEndpoint.body);
      }

      // 3️⃣ Fetch data from the primary endpoint
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      // Ensure primary data is wrapped in an object with key "productData" (or similar)
      let finalData = { productData: Array.isArray(data) ? data : [data] };

      // 4️⃣ Check if there is a chain endpoint defined (for example, to get product price)
      if (selectedEndpoint.chain) {
        const chainEndpoint = selectedEndpoint.chain;
        let chainUrl = chainEndpoint.url;
        if (chainEndpoint.query && typeof chainEndpoint.query === 'object') {
          const qs = new URLSearchParams(chainEndpoint.query);
          chainUrl += (chainUrl.includes('?') ? '&' : '?') + qs.toString();
        }
        const chainOptions = {
          method: chainEndpoint.method || 'GET',
          headers: chainEndpoint.headers || {}
        };
        if (chainEndpoint.body && chainOptions.method.toUpperCase() !== 'GET') {
          chainOptions.headers['Content-Type'] = 'application/json';
          chainOptions.body = JSON.stringify(chainEndpoint.body);
        }
        const chainResponse = await fetch(chainUrl, chainOptions);
        const chainData = await chainResponse.json();
        finalData.chainData = Array.isArray(chainData) ? chainData : [chainData];
      }

      // 5️⃣ Generate a human-readable response with OpenAI using the combined data
      const finalPrompt = `The following data was retrieved:
      ${JSON.stringify(finalData)}

      Please format the response in a clear, human-readable way in ${language}. 
      Example:
      - If language is 'en': 'The product "XYZ" is available. The total price is $123.45.'
      - If language is 'es': 'El producto "XYZ" está disponible. El precio total es $123.45.'
      
      Generate a similar response using the retrieved data.`;

      const finalResponse = await this.openai.createChatCompletion({
        model: model,
        messages: [
          { role: 'system', content: 'You are an assistant that formats responses based on database queries into natural language.' },
          ...messages,
          { role: 'user', content: finalPrompt }
        ],
        max_tokens: maxTokens,
      });

      return finalResponse.data.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error in getResponse:', error.message);
      return "An error occurred while processing your request. Please try again later.";
    }
  }
}

module.exports = ApiTalkChatGPT;
