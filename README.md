# Query Assistant - OpenAI API Query Module

## Overview
Api Talk Chatgpt is an NPM module that enables automatic selection of the best API endpoint based on user queries. It uses OpenAI's GPT models to analyze the query, fetch the relevant data from an API, and format the response in a structured way.

## Features
✅ Automatic selection of the best API endpoint based on user input.  
✅ Ensures JSON responses follow a structured format (`data: []`).  
✅ Supports OpenAI fine-tuning with real API examples.  
✅ User session tracking using `userId` for personalized responses.  
✅ Supports multiple response languages based on user preference.  
✅ Allows configuration of OpenAI model and max tokens.  
✅ Simple installation and usage across multiple projects.  

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
  model: "gpt-4", // Specify the model to use
  maxTokens: 200   // Set the max token limit
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

Example:
```javascript
const endpoints = [
  {
    name: "Users",
    url: "http://localhost:3000/users",
    description: "List of registered users.",
    examples: [
      "How many users are registered?",
      "Show me the list of users.",
      "Who are the latest registered users?"
    ],
    responseExample: {
      data: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" }
      ]
    }
  },
  {
    name: "Orders",
    url: "http://localhost:3000/orders",
    description: "List of completed orders.",
    examples: [
      "Show me the recent orders.",
      "How many orders are pending?",
      "Give me details of the last order."
    ],
    responseExample: {
      data: [
        { id: 101, customer: "John Doe", total: 150.50, status: "Shipped" },
        { id: 102, customer: "Jane Smith", total: 250.00, status: "Pending" }
      ]
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

