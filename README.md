# Query Assistant - OpenAI API Query Module

## Overview
Api Talk ChatGPT is an NPM module that enables automatic selection of the best API endpoint based on user queries. It uses OpenAI's GPT models to analyze the query, fetch the relevant data from an API, and format the response in a structured manner.

## Features
- ✅ Automatically selects the most appropriate endpoint based on the query.
- ✅ Ensures JSON responses follow a structured format (`data: []`).
- ✅ Supports OpenAI fine-tuning with real API examples.
- ✅ Tracks user sessions using `userId` for personalized responses.
- ✅ Supports multiple response languages based on user preference.
- ✅ Allows configuration of the OpenAI model and maximum tokens.
- ✅ Permits overriding the default model and max tokens per query using the `options` parameter.
- ✅ Supports defining **headers** (e.g., Authorization), **query parameters**, and **body** for each endpoint.
- ✅ Supports **chaining endpoints**: you can define a secondary endpoint (e.g., to get product price) that is called after the primary endpoint.
- ✅ Simple installation and usage across multiple projects.
---

## Installation
To install the package, run:

```sh
npm install api-talk-chatgpt
```

---

## Usage
### Import and Initialize
```javascript
const QueryAssistant = require('api-talk-chatgpt');

const assistant = new QueryAssistant({
  openAIApiKey: "YOUR_OPENAI_API_KEY",
  model: "gpt-4",    // Default model to use
  maxTokens: 200     // Maximum token limit per response
});
```

---

## Defining API Endpoints
Each endpoint should include:
- `name`: A unique identifier for the endpoint.
- `url`: The API URL to fetch data from.
- `description`: A short description of the endpoint.
- `examples`: Common queries that would use this endpoint.
- `responseExample`: A sample response in the expected format (`data: []`).


Additionally, you can optionally include:
- `method`: HTTP method (default is GET).
- `headers`: An object with the necessary headers (e.g., Authorization).
- `query`: An object with query parameters to append to the URL.
- `body`: The request body (sent as JSON if the method is not GET).


Chaining Endpoints
You can define a secondary endpoint in a property named chain. If the primary endpoint returns data (e.g., product information) and requires a follow-up request (e.g., for pricing), define the secondary endpoint with the same optional parameters (url, method, headers, query, and body). The module will perform the primary API call and then execute the chain endpoint, combining both responses.

Example:
```javascript
const endpoints = [
  {
    name: "ProductInfo",
    url: "http://localhost:3000/products",
    description: "Retrieves product information.",
    examples: [
      "Get product details.",
      "Show me product info."
    ],
    responseExample: {
      data: [
        { id: 1, name: "Product XYZ", available: true }
      ]
    },
    // Define a chain endpoint to retrieve product price details
    chain: {
      url: "http://localhost:3000/prices",
      method: "GET",
      query: {
        currency: "USD"
      },
      headers: {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    }
  }
];
```

---

## Querying the Assistant
### Simple Query with Language Preference
```javascript
async function runQuery() {
  const response = await assistant.getResponse("Show me the pending orders", endpoints, [], "en");
  console.log("🔹 Response:", response);
}

runQuery();
```

## Overriding the Default Model and Max Tokens
### You can override the default model and max tokens on a per-query basis by passing the options parameter:
```javascript
async function runCustomQuery() {
  const response = await assistant.getResponse(
    "Show me the pending orders", 
    endpoints, 
    [], 
    "en", 
    { model: "gpt-3.5-turbo", maxTokens: 150 }
  );
  console.log("🔹 Custom Response:", response);
}

runCustomQuery();
```



### Handling User Sessions with `userId`
To maintain a conversation context, pass a `userId` in the `messages` array and specify the preferred language:
```javascript
async function runUserQuery() {
  const messages = [
    { role: "system", content: "You are an API assistant." },
    { role: "user", content: "What orders are pending?", userId: "12345" }
  ];

  const response = await assistant.getResponse("What orders are pending?", endpoints, messages, "es");
  console.log("🔹 User Response:", response);
}

runUserQuery();
```

---

## Expected Output
If the query is: **"What orders are pending?"**, and the system selects the `Orders` endpoint, the response will be:
```
The following orders are currently pending:
- Order ID: 102
  Customer: Jane Smith
  Total: $250.00
  Status: Pending
```
If the user selects Spanish (`"es"`), the response will be:
```
Los siguientes pedidos están pendientes:
- ID del Pedido: 102
  Cliente: Jane Smith
  Total: $250.00
  Estado: Pendiente
```

---

## Next Steps
- Implement **caching** to optimize API calls.
- Add **pagination support** for large data sets.
- Extend **user session tracking** for dynamic conversations.

For any issues or feature requests, feel free to open a ticket on GitHub! 🚀

