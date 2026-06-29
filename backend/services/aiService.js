const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_TTS_MODEL =
  "canopylabs/orpheus-v1-english";

const GROQ_TTS_VOICE =
  "Fritz-PlayAI";

const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";

/*
|--------------------------------------------------------------------------
| INTENT ANALYSIS
|--------------------------------------------------------------------------
*/

async function analyzeUserMessage(
  messages
) {
  const completion =
    await groq.chat.completions.create({
      model:
        GROQ_CHAT_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are an Inventory Management AI Agent.

Your job is to identify the user's intent
and extract structured data.

Return ONLY valid JSON.

Possible intents:

create_customer
create_product

update_customer
delete_customer

update_product
delete_product

show_customers
show_products

dashboard_stats

general_question

Customer Fields:

customerName
customerNewName
dob
email
phone
location

Product Fields:

productName
productNewName
productPrice
productQuantity
customerName

Examples:

User:
Create customer Raj

Response:
{
  "intent":"create_customer",
  "customerName":"Raj"
}

User:
Create customer Raj born on 2005-03-09

Response:
{
  "intent":"create_customer",
  "customerName":"Raj",
  "dob":"2005-03-09"
}

User:
Update customer Mohamed Yousuf to Mohamed Jasir

Response:
{
  "intent":"update_customer",
  "customerName":"Mohamed Yousuf",
  "customerNewName":"Mohamed Jasir"
}

User:
Change customer Raj to Ravi

Response:
{
  "intent":"update_customer",
  "customerName":"Raj",
  "customerNewName":"Ravi"
}

User:
Update customer Raj location to Chennai

Response:
{
  "intent":"update_customer",
  "customerName":"Raj",
  "location":"Chennai"
}

User:
Delete customer Raj

Response:
{
  "intent":"delete_customer",
  "customerName":"Raj"
}

User:
Create product Laptop price 50000 quantity 5 for Raj

Response:
{
  "intent":"create_product",
  "productName":"Laptop",
  "productPrice":50000,
  "productQuantity":5,
  "customerName":"Raj"
}

User:
Update Laptop quantity to 20

Response:
{
  "intent":"update_product",
  "productName":"Laptop",
  "productQuantity":20
}

User:
Change Laptop price to 60000

Response:
{
  "intent":"update_product",
  "productName":"Laptop",
  "productPrice":60000
}

User:
Update product Laptop quantity 100

Response:
{
  "intent":"update_product",
  "productName":"Laptop",
  "productQuantity":100
}

User:
Delete product Laptop

Response:
{
  "intent":"delete_product",
  "productName":"Laptop"
}

User:
Show all customers

Response:
{
  "intent":"show_customers"
}

User:
Show all products

Response:
{
  "intent":"show_products"
}

User:
Dashboard summary

Response:
{
  "intent":"dashboard_stats"
}

User:
Hello

Response:
{
  "intent":"general_question"
}
`,
        },

        ...messages,
      ],

      response_format: {
        type: "json_object",
      },

      temperature: 0,
    });

  const content =
    completion.choices[0]
      .message.content;

  return JSON.parse(content);
}

/*
|--------------------------------------------------------------------------
| NATURAL RESPONSE GENERATION
|--------------------------------------------------------------------------
*/

async function generateResponse(
  prompt
) {
  const completion =
    await groq.chat.completions.create({
      model:
        GROQ_CHAT_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are a professional Inventory Management Assistant.

Rules:

- Reply naturally.
- Reply like a human.
- Be concise.
- Do not give unnecessary information.
- Answer only what the user asked.
- Avoid robotic responses.
- Do not return JSON.
- Spoken commands may be informal; infer the intended inventory action and entities from voice-style phrasing.
`,
        },

        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
    });

  return completion.choices[0]
    .message.content;
}

async function generateVoiceAudio(
  text
) {
  const speech =
    await groq.audio.speech.create({
      input: text,
      model: GROQ_TTS_MODEL,
      voice: GROQ_TTS_VOICE,
      response_format: "wav",
    });

  const audioBuffer =
    Buffer.from(
      await speech.arrayBuffer()
    );

  return audioBuffer;
}

/*
|--------------------------------------------------------------------------
| FOLLOW UP QUESTION GENERATION
|--------------------------------------------------------------------------
*/

async function generateFollowUpQuestion(
  workflow,
  fieldName,
  existingData
) {
  const completion =
    await groq.chat.completions.create({
      model:
        GROQ_CHAT_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are a friendly AI assistant.

Your job is to ask for ONE missing field.

Rules:

- Ask naturally.
- Ask only for the requested field.
- Do not mention other fields.
- Keep it short.
- Sound human.

Examples:

Field: dob

Possible Response:
"What's Raj's date of birth?"

Field: email

Possible Response:
"Could you share Raj's email address?"

Field: phone

Possible Response:
"Thanks. What's Raj's phone number?"

Field: location

Possible Response:
"Where is Raj located?"

Field: productPrice

Possible Response:
"What price should I register for this product?"

Field: productQuantity

Possible Response:
"How many units would you like to add?"
`,
        },

        {
          role: "user",
          content: `
Workflow:
${workflow}

Field:
${fieldName}

Current Data:
${JSON.stringify(
  existingData,
  null,
  2
)}
`,
        },
      ],

      temperature: 0.9,
    });

  return completion.choices[0]
    .message.content;
}

/*
|--------------------------------------------------------------------------
| SUCCESS MESSAGE GENERATION
|--------------------------------------------------------------------------
*/

async function generateSuccessMessage(
  action,
  data
) {
  const completion =
    await groq.chat.completions.create({
      model:
        GROQ_CHAT_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are an Inventory Management Assistant.

Generate a short professional success message.

Examples:

Customer Raj created.

Product Laptop created.

Customer Raj updated.

Product Laptop deleted.

Keep it short.
`,
        },

        {
          role: "user",
          content: `
Action:
${action}

Data:
${JSON.stringify(data)}
`,
        },
      ],

      temperature: 0.8,
    });

  return completion.choices[0]
    .message.content;
}

/*
|--------------------------------------------------------------------------
| FOLLOW UP QUESTION
|--------------------------------------------------------------------------
*/

async function generateFollowUpQuestion(
  workflow,
  fieldName,
  existingData
) {
  const completion =
    await groq.chat.completions.create({
      model:
        GROQ_CHAT_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are a professional inventory assistant.

Ask for ONE missing field only.

Be conversational.

Do not ask multiple questions.

Examples:

What's Raj's date of birth?

Could you share Raj's email address?

What's Raj's phone number?

Where is Raj located?

How many units would you like to add?

What price should I register for this product?
`,
        },

        {
          role: "user",
          content: `
Workflow:
${workflow}

Field:
${fieldName}

Current Data:
${JSON.stringify(
  existingData,
  null,
  2
)}
`,
        },
      ],

      temperature: 0.8,
    });

  return completion.choices[0]
    .message.content;
}

/*
|--------------------------------------------------------------------------
| SUCCESS MESSAGE
|--------------------------------------------------------------------------
*/

async function generateSuccessMessage(
  action,
  data
) {
  const completion =
    await groq.chat.completions.create({
      model:
        "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
Generate a short success message.

Examples:

Customer Raj created successfully.

Product Laptop created successfully.

Keep it concise.
`,
        },

        {
          role: "user",
          content: `
Action:
${action}

Data:
${JSON.stringify(data)}
`,
        },
      ],

      temperature: 0.7,
    });

  return completion.choices[0]
    .message.content;
}

async function generateConversationalResponse(
  messages
) {
  const completion =
    await groq.chat.completions.create({
      model:
        "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: `
You are an intelligent Inventory Management Assistant.

You can:

- Manage customers
- Manage products
- Answer inventory questions
- Hold natural conversations
- Remember previous messages from the current chat

Rules:

- Be conversational.
- Use previous chat context when relevant.
- Reply naturally.
- Do not return JSON.
- Answer like ChatGPT.
`,
        },

        ...messages,
      ],

      temperature: 0.8,
    });

  return completion.choices[0]
    .message.content;
}

module.exports = {
  analyzeUserMessage,
  generateResponse,
  generateConversationalResponse,
  generateFollowUpQuestion,
  generateSuccessMessage,
  generateVoiceAudio,
};

