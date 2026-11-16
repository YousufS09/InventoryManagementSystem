const { z } = require("zod");

const ai = require("../services/aiService");
const customerService = require("../services/customerService");
const productService = require("../services/productService");
const { getDashboardStats } = require("../services/dashboardService");
const { getSession, saveSession, clearSession } = require("../services/sessionService");
const { validate, fields } = require("../utils/validation");

// Only the most recent messages are sent to the LLM, so token cost stays bounded.
const MAX_HISTORY = 12;
// Lists larger than this are truncated before being given to the LLM.
const MAX_LIST_ROWS = 50;
const ACTION_PREFIX = "__ACTION__:";

const requestSchema = z.object({
  sessionId: z.string().trim().min(1).max(100),
  voiceOutput: z.boolean().optional().default(false),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .min(1),
});

const FIELD_LABELS = {
  customerName: "name",
  dob: "date of birth",
  email: "email",
  phone: "phone",
  location: "location",
  productName: "name",
  productPrice: "price",
  productQuantity: "quantity",
};

// Fields collected one at a time when creating a record.
// For create_product, "customerName" is the existing customer the product belongs to.
const CREATE_FLOWS = {
  create_customer: ["customerName", "dob", "email", "phone", "location"],
  create_product: ["productName", "productPrice", "productQuantity", "customerName"],
};

// Maps fields the LLM extracts for updates to the fields stored in the database.
const UPDATE_FIELDS = {
  customer: {
    customerNewName: "customerName",
    dob: "dob",
    email: "email",
    phone: "phone",
    location: "location",
  },
  product: {
    productNewName: "productName",
    productPrice: "productPrice",
    productQuantity: "productQuantity",
  },
};

const UPDATE_ACTIONS = [
  { id: "confirm_update", label: "✅ Confirm Update" },
  { id: "cancel_update", label: "❌ Cancel" },
];

const DELETE_ACTIONS = [
  { id: "confirm_delete", label: "🗑 Confirm Delete" },
  { id: "cancel_delete", label: "❌ Cancel" },
];

function isSmallTalk(message) {
  return /\b(hi|hello|hey|help|thanks|thank you|what can you do|who are you|how are you|good morning|good afternoon|good evening)\b/i.test(
    message
  );
}

function isCancel(message) {
  return /^(cancel|stop|abort|never ?mind|forget it)[.!]?$/i.test(message.trim());
}

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

// Voice and chat answers often wrap numbers in words ("50,000 rupees"); keep just the number.
function extractNumber(value) {
  if (typeof value === "number") {
    return value;
  }
  const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? match[0] : String(value);
}

function validateField(field, raw) {
  const value =
    field === "productPrice" || field === "productQuantity"
      ? extractNumber(raw)
      : String(raw);
  return validate(fields[field], value);
}

function formatValue(field, value) {
  return field === "productPrice" ? `₹${Number(value).toLocaleString("en-IN")}` : `"${value}"`;
}

function describeChanges(changes) {
  return Object.entries(changes)
    .map(([field, value]) => `${FIELD_LABELS[field]} to ${formatValue(field, value)}`)
    .join(", ");
}

/*
|--------------------------------------------------------------------------
| Record lookup
|--------------------------------------------------------------------------
| A reference can be a name ("Raj") or an ID ("#12" / "12"). Duplicate names
| are reported back so the user can pick one by ID, instead of silently
| acting on the first match.
*/

async function resolveRecord(kind, reference) {
  const text = String(reference ?? "").trim();
  const service = kind === "customer" ? customerService : productService;
  const nameKey = kind === "customer" ? "customer_name" : "product_name";

  const idMatch = text.match(/^#?(\d+)$/);
  if (idMatch) {
    const record =
      kind === "customer"
        ? await service.getCustomerById(Number(idMatch[1]))
        : await service.getProductById(Number(idMatch[1]));
    return record
      ? { record, name: record[nameKey] }
      : { error: `I couldn't find a ${kind} with ID ${idMatch[1]}.` };
  }

  const matches =
    kind === "customer"
      ? await service.findCustomersByName(text)
      : await service.findProductsByName(text);

  if (matches.length === 0) {
    return { error: `I couldn't find a ${kind} named "${text}".` };
  }

  if (matches.length > 1) {
    const ids = matches.map((match) => `#${match.id}`).join(", ");
    return {
      error: `There are ${matches.length} ${kind}s named "${text}" (${ids}). Please refer to one by ID, for example "${kind} ${ids.split(", ")[0]}".`,
    };
  }

  return { record: matches[0], name: matches[0][nameKey] };
}

/*
|--------------------------------------------------------------------------
| Create flows (ask for one missing field at a time)
|--------------------------------------------------------------------------
*/

async function acceptField(workflow, field, raw) {
  if (workflow === "create_product" && field === "customerName") {
    const { record, name, error } = await resolveRecord("customer", raw);
    if (error) {
      return { error };
    }
    return { values: { customerName: name, customerId: record.id } };
  }

  const { data, error } = validateField(field, raw);
  return error ? { error } : { values: { [field]: data } };
}

function nextMissingField(workflow, data) {
  return CREATE_FLOWS[workflow].find((field) => data[field] === undefined);
}

async function advanceCreateFlow(key, session) {
  const field = nextMissingField(session.workflow, session.data);

  if (field) {
    saveSession(key, session);
    return {
      reply: await ai.generateFollowUpQuestion(session.workflow, field, session.data),
    };
  }

  clearSession(key);

  if (session.workflow === "create_customer") {
    const customerId = await customerService.createCustomer(session.data);
    return {
      reply: await ai.generateSuccessMessage("create_customer", { ...session.data, customerId }),
    };
  }

  const productId = await productService.createProduct(session.data);
  return {
    reply: await ai.generateSuccessMessage("create_product", { ...session.data, productId }),
  };
}

async function startCreateFlow(key, workflow, aiResult) {
  const data = {};
  const problems = [];

  // Keep every field the user already gave in the first message ("Create product Laptop price 500 ...").
  for (const field of CREATE_FLOWS[workflow]) {
    if (isBlank(aiResult[field])) {
      continue;
    }
    const { values, error } = await acceptField(workflow, field, aiResult[field]);
    if (error) {
      problems.push(error);
    } else {
      Object.assign(data, values);
    }
  }

  const result = await advanceCreateFlow(key, { workflow, data });
  if (problems.length > 0) {
    result.reply = `${problems.join(" ")} ${result.reply}`;
  }
  return result;
}

async function continueCreateFlow(key, session, message) {
  const field = nextMissingField(session.workflow, session.data);
  const { values, error } = await acceptField(session.workflow, field, message);

  if (error) {
    saveSession(key, session);
    return { reply: `${error} Please try again, or say "cancel" to stop.` };
  }

  Object.assign(session.data, values);
  return advanceCreateFlow(key, session);
}

/*
|--------------------------------------------------------------------------
| Update / delete (always confirmed with buttons before running)
|--------------------------------------------------------------------------
*/

async function startUpdate(key, kind, aiResult) {
  const reference = kind === "customer" ? aiResult.customerName : aiResult.productName;

  if (isBlank(reference)) {
    return {
      reply: await ai.generateFollowUpQuestion(
        `update_${kind}`,
        kind === "customer" ? "customerName" : "productName",
        {}
      ),
    };
  }

  const { record, name, error } = await resolveRecord(kind, reference);
  if (error) {
    return { reply: error };
  }

  const changes = {};
  for (const [source, target] of Object.entries(UPDATE_FIELDS[kind])) {
    if (isBlank(aiResult[source])) {
      continue;
    }
    const { data, error: fieldError } = validateField(target, aiResult[source]);
    if (fieldError) {
      return { reply: fieldError };
    }
    changes[target] = data;
  }

  if (Object.keys(changes).length === 0) {
    const options = Object.values(UPDATE_FIELDS[kind]).map((field) => FIELD_LABELS[field]);
    return {
      reply: `What would you like to change for ${kind} "${name}"? I can update the ${options.join(", ")}.`,
    };
  }

  saveSession(key, { workflow: "confirm_update", kind, id: record.id, name, changes });

  return {
    reply: `Please confirm: change ${kind} "${name}" (ID ${record.id}) — ${describeChanges(changes)}.`,
    actions: UPDATE_ACTIONS,
  };
}

async function startDelete(key, kind, aiResult) {
  const reference = kind === "customer" ? aiResult.customerName : aiResult.productName;

  if (isBlank(reference)) {
    return {
      reply: await ai.generateFollowUpQuestion(
        `delete_${kind}`,
        kind === "customer" ? "customerName" : "productName",
        {}
      ),
    };
  }

  const { record, name, error } = await resolveRecord(kind, reference);
  if (error) {
    return { reply: error };
  }

  saveSession(key, { workflow: "confirm_delete", kind, id: record.id, name });

  const cascadeNote =
    kind === "customer" ? " This also deletes all products linked to this customer." : "";

  return {
    reply: `Are you sure you want to delete ${kind} "${name}" (ID ${record.id})?${cascadeNote}`,
    actions: DELETE_ACTIONS,
  };
}

async function handleAction(key, actionId) {
  const session = getSession(key);
  const expectedWorkflow = actionId.endsWith("_update") ? "confirm_update" : "confirm_delete";

  if (!session || session.workflow !== expectedWorkflow) {
    return { reply: "That request has expired or was already handled. Please ask again." };
  }

  clearSession(key);

  if (actionId.startsWith("cancel_")) {
    return {
      reply:
        expectedWorkflow === "confirm_delete"
          ? "Okay, nothing was deleted."
          : "Okay, I left it unchanged.",
    };
  }

  const { kind, id, name } = session;
  let succeeded;

  if (expectedWorkflow === "confirm_update") {
    succeeded =
      kind === "customer"
        ? await customerService.updateCustomer(id, session.changes)
        : await productService.updateProduct(id, session.changes);
  } else {
    succeeded =
      kind === "customer"
        ? await customerService.deleteCustomer(id)
        : await productService.deleteProduct(id);
  }

  if (!succeeded) {
    return { reply: `${kind === "customer" ? "Customer" : "Product"} "${name}" no longer exists.` };
  }

  return {
    reply:
      expectedWorkflow === "confirm_update"
        ? `Done. ${kind === "customer" ? "Customer" : "Product"} "${name}" was updated: ${describeChanges(session.changes)}.`
        : `Done. ${kind === "customer" ? "Customer" : "Product"} "${name}" was deleted.`,
  };
}

/*
|--------------------------------------------------------------------------
| Read-only intents
|--------------------------------------------------------------------------
*/

async function describeList(kind) {
  const rows =
    kind === "customers" ? await customerService.listCustomers() : await productService.listProducts();

  if (rows.length === 0) {
    return { reply: `You don't have any ${kind} yet.` };
  }

  const shown = rows.slice(0, MAX_LIST_ROWS);
  const truncatedNote =
    rows.length > shown.length
      ? `\nThere are ${rows.length} ${kind} in total; only the newest ${shown.length} are listed. Mention that the full list is on the ${kind} page.`
      : "";

  return {
    reply: await ai.generateResponse(
      `Show these ${kind} to the user:\n\n${JSON.stringify(shown, null, 2)}${truncatedNote}`
    ),
  };
}

async function describeStats() {
  const stats = await getDashboardStats();
  return {
    reply: await ai.generateResponse(
      `Explain these dashboard stats (values are in Indian Rupees):\n\n${JSON.stringify(stats, null, 2)}`
    ),
  };
}

/*
|--------------------------------------------------------------------------
| Entry point
|--------------------------------------------------------------------------
*/

async function handleMessage(key, message, history) {
  if (message.startsWith(ACTION_PREFIX)) {
    return handleAction(key, message.slice(ACTION_PREFIX.length));
  }

  const session = getSession(key);

  if (isCancel(message)) {
    clearSession(key);
    return { reply: session ? "Okay, I've cancelled that." : "There's nothing in progress to cancel." };
  }

  if (session && CREATE_FLOWS[session.workflow] && !isSmallTalk(message)) {
    return continueCreateFlow(key, session, message);
  }

  // Anything else abandons a half-finished flow or an unanswered confirmation.
  if (session) {
    clearSession(key);
  }

  const aiResult = (await ai.analyzeUserMessage(history)) || { intent: "general_question" };

  switch (aiResult.intent) {
    case "create_customer":
    case "create_product":
      return startCreateFlow(key, aiResult.intent, aiResult);
    case "update_customer":
      return startUpdate(key, "customer", aiResult);
    case "update_product":
      return startUpdate(key, "product", aiResult);
    case "delete_customer":
      return startDelete(key, "customer", aiResult);
    case "delete_product":
      return startDelete(key, "product", aiResult);
    case "show_customers":
      return describeList("customers");
    case "show_products":
      return describeList("products");
    case "dashboard_stats":
      return describeStats();
    default:
      return { reply: await ai.generateConversationalResponse(history) };
  }
}

async function chatWithAssistant(req, res) {
  const { data: body, error } = validate(requestSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const history = body.messages.slice(-MAX_HISTORY);
  const latest = history[history.length - 1];

  if (latest.role !== "user" || !latest.content.trim()) {
    return res.status(400).json({ error: "The last message must be a non-empty user message." });
  }

  // Sessions are scoped to the signed-in user, so two users on one browser never share a flow.
  const sessionKey = `${req.user.id}:${body.sessionId}`;

  try {
    const result = await handleMessage(sessionKey, latest.content.trim(), history);

    if (body.voiceOutput && result.reply) {
      try {
        const audio = await ai.generateVoiceAudio(result.reply);
        result.audioBase64 = audio.toString("base64");
      } catch (ttsError) {
        // The browser falls back to its own speech synthesis.
        console.error("Groq TTS failed:", ttsError.status || "", ttsError.message);
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("Assistant error:", err);

    if (err?.status === 401) {
      return res.status(502).json({
        error: "The AI service rejected the API key. Check GROQ_API_KEY on the server.",
      });
    }

    if (err?.status === 429) {
      return res.status(503).json({ error: "The AI service is busy. Please try again in a moment." });
    }

    return res.status(500).json({ error: "Failed to process assistant request" });
  }
}

module.exports = {
  chatWithAssistant,
};
