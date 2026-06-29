const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_TTS_MODEL =
  "canopylabs/orpheus-v1-english";

const GROQ_TTS_VOICE =
  "Fritz-PlayAI";

const GROQ_CHAT_MODEL = "llama-3.1-8b-instant";

function getLatestUserText(messages) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user" && typeof message.content === "string") {
      return message.content.trim();
    }
  }

  return "";
}

function looksLikeExplicitInventoryCommand(text) {
  return /\b(create|add|register|make|update|edit|change|rename|delete|remove|show|list|display|count|summary|dashboard|report)\b/i.test(
    text
  );
}

function normalizeIntentResult(result, latestText) {
  if (!result || typeof result !== "object") {
    return { intent: "general_question" };
  }

  const normalizedText = latestText.trim();
  const hasExplicitCommand = looksLikeExplicitInventoryCommand(normalizedText);
  const hasInventoryContext = /\b(customer|customers|product|products|inventory|stock|dashboard|item|items)\b/i.test(
    normalizedText
  );

  const needsStrictIntent =
    [
      "create_customer",
      "create_product",
      "update_customer",
      "delete_customer",
      "update_product",
      "delete_product",
    ].includes(result.intent);

  if (needsStrictIntent && !hasExplicitCommand && !hasInventoryContext) {
    return {
      intent: "general_question",
    };
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| INTENT ANALYSIS
|--------------------------------------------------------------------------
*/

async function analyzeUserMessage(
  messages
) {
  const latestText =
    getLatestUserText(messages);

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

Classify as create/update/delete only when the user clearly asks to manage inventory.
If the user is greeting, chatting, asking for help, or asking a general question,
use general_question unless they explicitly ask for a customer/product action.

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

User:
What can you do?

Response:
{
  "intent":"general_question"
}

User:
How many customers do I have?

Response:
{
  "intent":"dashboard_stats"
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

  return normalizeIntentResult(
    JSON.parse(content),
    latestText
  );
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
- Vary your sentence openings and wording.
- Do not reuse the same phrasing repeatedly.
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
| DYNAMIC FOLLOW-UP / STATUS RESPONSES
|--------------------------------------------------------------------------
*/

async function generateFollowUpQuestion(
  workflow,
  fieldName,
  existingData
) {
  const completion =
    await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `
You are a natural-sounding inventory assistant.

Ask exactly one short follow-up question for the missing field.

Rules:
- Sound human, not templated.
- Do not mention the workflow name.
- Do not ask about any other field.
- Vary your wording each time.
- Keep it brief and conversational.

Examples:
- "What’s the customer’s name?"
- "Could you share the email address?"
- "What’s the phone number?"
- "Which location should I use?"
- "What price should I set?"
- "How many units should I add?"
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
${JSON.stringify(existingData, null, 2)}
          `,
        },
      ],
      temperature: 0.9,
    });

  return completion.choices[0].message.content;
}

async function generateSuccessMessage(action, data) {
  const completion =
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a natural inventory assistant.

Write a short, friendly success message.

Rules:
- Vary the wording.
- Do not sound robotic.
- Keep it to one sentence.
- Mention the entity name if available.
          `,
        },
        {
          role: "user",
          content: `
Action:
${action}

Data:
${JSON.stringify(data, null, 2)}
          `,
        },
      ],
      temperature: 0.9,
    });

  return completion.choices[0].message.content;
}

async function generateConversationalResponse(messages) {
  const completion =
    await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a warm, natural Inventory Management Assistant.

You can help with customers, products, inventory summaries, and general questions.

Rules:
- Respond naturally and dynamically.
- Avoid repetitive phrases.
- Do not sound scripted.
- Keep replies concise unless the user asks for detail.
- If the message is ambiguous, ask one short clarifying question.
- Do not return JSON.
          `,
        },
        ...messages,
      ],
      temperature: 0.9,
    });

  return completion.choices[0].message.content;
}

module.exports = {
  analyzeUserMessage,
  generateResponse,
  generateConversationalResponse,
  generateFollowUpQuestion,
  generateSuccessMessage,
  generateVoiceAudio,
};

