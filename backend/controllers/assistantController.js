const {
  analyzeUserMessage,
  generateResponse,
  generateConversationalResponse,
  generateFollowUpQuestion,
  generateSuccessMessage,
  generateVoiceAudio,
} = require(
  "../services/aiService"
);

const {
  createCustomer,
  updateCustomer,
  deleteCustomer,

  createProduct,
  updateProduct,
  deleteProduct,

  getCustomers,
  getProducts,
  getDashboardStats,

  findCustomerByName,
  findProductByName,
} = require(
  "../services/actionService"
);

const {
  getSession,
  saveSession,
  updateSessionData,
  clearSession,
} = require(
  "../services/sessionService"
);

const {
  normalizeDate,
} = require(
  "../utils/dateUtils"
);

const CUSTOMER_FIELDS = [
  "customerName",
  "dob",
  "email",
  "phone",
  "location",
];

const PRODUCT_FIELDS = [
  "productName",
  "productPrice",
  "productQuantity",
  "customerName",
];

async function chatWithAssistant(req,res) {
  try {
    const {
      messages,
      sessionId,
      voiceOutput = false,
    } = req.body;

    const latestMessage =
      messages[
        messages.length - 1
      ].content;

    const originalJson =
      res.json.bind(res);

    res.json = async (
      payload
    ) => {
      if (
        voiceOutput &&
        payload &&
        payload.reply &&
        !payload.error &&
        !payload.audioBase64
      ) {
        try {
          const audioBuffer =
            await generateVoiceAudio(
              payload.reply
            );

          payload.audioBase64 =
            audioBuffer.toString(
              "base64"
            );
        } catch (ttsError) {
          console.error(
            "Groq TTS failed:",
            ttsError
          );
        }
      }

      return originalJson(
        payload
      );
    };

    /*
    ======================================
    ACTIVE SESSION
    ======================================
    */

    const session =
      getSession(sessionId);

    if (session) {
  /*
  ======================================
  UPDATE CUSTOMER - ACTION HANDLER
  ======================================
  */

  if (
    session.workflow ===
    "update_customer_confirmation"
  ) {
    if (
      latestMessage ===
      "__ACTION__:confirm_update"
    ) {
      const customer =
        await findCustomerByName(
          session.data.customerName
        );

      if (!customer) {
        clearSession(
          sessionId
        );

        return res.json({
          reply:
            "Customer not found.",
        });
      }

      const updateData =
        {};

      updateData[
        session.data.fieldName
      ] =
        session.data.newValue;

      await updateCustomer(
        customer.id,
        updateData
      );

      clearSession(
        sessionId
      );

      return res.json({
        reply:
          "Customer updated successfully.",
      });
    }

    if (
      latestMessage ===
      "__ACTION__:cancel_update"
    ) {
      clearSession(
        sessionId
      );

      return res.json({
        reply:
          "Update cancelled.",
      });
    }
  }

  /*
======================================
UPDATE PRODUCT - ACTION HANDLER
======================================
*/

if (
  session.workflow ===
  "update_product_confirmation"
) {
  if (
    latestMessage ===
    "__ACTION__:confirm_update"
  ) {
    const product =
      await findProductByName(
        session.data.productName
      );

    if (!product) {
      clearSession(
        sessionId
      );

      return res.json({
        reply:
          "Product not found.",
      });
    }

    const updateData =
      {};

    updateData[
      session.data.fieldName
    ] =
      session.data.newValue;

    await updateProduct(
      product.id,
      updateData
    );

    clearSession(
      sessionId
    );

    return res.json({
      reply:
        "Product updated successfully.",
    });
  }

  if (
    latestMessage ===
    "__ACTION__:cancel_update"
  ) {
    clearSession(
      sessionId
    );

    return res.json({
      reply:
        "Product update cancelled.",
    });
  }
}

/*
======================================
DELETE CUSTOMER - ACTION HANDLER
======================================
*/

if (
  session.workflow ===
  "delete_customer_confirmation"
) {

  if (
    latestMessage ===
    "__ACTION__:confirm_delete"
  ) {
    const customer =
      await findCustomerByName(
        session.data.customerName
      );

    if (!customer) {
      clearSession(
        sessionId
      );

      return res.json({
        reply:
          "Customer not found.",
      });
    }

    await deleteCustomer(
      customer.id
    );

    clearSession(
      sessionId
    );

    return res.json({
      reply:
        "Customer deleted successfully.",
    });
  }

  if (
    latestMessage ===
    "__ACTION__:cancel_delete"
  ) {
    clearSession(
      sessionId
    );

    return res.json({
      reply:
        "Delete operation cancelled.",
    });
  }
}

/*
======================================
DELETE PRODUCT - ACTION HANDLER
======================================
*/

if (
  session.workflow ===
  "delete_product_confirmation"
) {
  if (
    latestMessage ===
    "__ACTION__:confirm_delete"
  ) {
    const product =
      await findProductByName(
        session.data.productName
      );

    if (!product) {
      clearSession(
        sessionId
      );

      return res.json({
        reply:
          "Product not found.",
      });
    }

    await deleteProduct(
      product.id
    );

    clearSession(
      sessionId
    );

    return res.json({
      reply:
        "Product deleted successfully.",
    });
  }

  if (
    latestMessage ===
    "__ACTION__:cancel_delete"
  ) {
    clearSession(
      sessionId
    );

    return res.json({
      reply:
        "Delete operation cancelled.",
    });
  }
}
  /*
  --------------------------------------
  CUSTOMER WORKFLOW
  --------------------------------------
  */

  if (
    session.workflow ===
    "create_customer"
  ) {
    const data =
      session.data;

    if (!data.dob) {
      const formattedDob =
        normalizeDate(
          latestMessage
        );

      if (!formattedDob) {
        return res.json({
          reply:
            "I couldn't understand that date. Please enter a valid date of birth.",
        });
      }

      updateSessionData(
        sessionId,
        {
          dob: formattedDob,
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const question =
        await generateFollowUpQuestion(
          "create_customer",
          "email",
          updated.data
        );

      return res.json({
        reply: question,
      });
    }

    if (!data.email) {
      updateSessionData(
        sessionId,
        {
          email:
            latestMessage,
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const question =
        await generateFollowUpQuestion(
          "create_customer",
          "phone",
          updated.data
        );

      return res.json({
        reply: question,
      });
    }

    if (!data.phone) {
      updateSessionData(
        sessionId,
        {
          phone:
            latestMessage,
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const question =
        await generateFollowUpQuestion(
          "create_customer",
          "location",
          updated.data
        );

      return res.json({
        reply: question,
      });
    }

    if (!data.location) {
      updateSessionData(
        sessionId,
        {
          location:
            latestMessage,
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const result =
        await createCustomer(
          updated.data
        );

      clearSession(
        sessionId
      );

      const reply =
        await generateSuccessMessage(
          "create_customer",
          {
            ...updated.data,
            customerId:
              result.customerId,
          }
        );

      return res.json({
        reply,
      });
    }
  }

  /*
  --------------------------------------
  PRODUCT WORKFLOW
  --------------------------------------
  */

  if (
    session.workflow ===
    "create_product"
  ) {
    const data =
      session.data;

    if (
      !data.productPrice
    ) {
      updateSessionData(
        sessionId,
        {
          productPrice:
            Number(
              latestMessage
            ),
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const question =
        await generateFollowUpQuestion(
          "create_product",
          "productQuantity",
          updated.data
        );

      return res.json({
        reply: question,
      });
    }

    if (
      !data.productQuantity
    ) {
      updateSessionData(
        sessionId,
        {
          productQuantity:
            Number(
              latestMessage
            ),
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const question =
        await generateFollowUpQuestion(
          "create_product",
          "customerName",
          updated.data
        );

      return res.json({
        reply: question,
      });
    }

    if (
      !data.customerName
    ) {
      updateSessionData(
        sessionId,
        {
          customerName:
            latestMessage,
        }
      );

      const updated =
        getSession(
          sessionId
        );

      const customer =
        await findCustomerByName(
          updated.data
            .customerName
        );

      if (!customer) {
        clearSession(
          sessionId
        );

        return res.json({
          reply:
            "I couldn't find that customer in the database.",
        });
      }

      const result =
        await createProduct({
          productName:
            updated.data
              .productName,

          productPrice:
            updated.data
              .productPrice,

          productQuantity:
            updated.data
              .productQuantity,

          customerId:
            customer.id,
        });

      clearSession(
        sessionId
      );

      const reply =
        await generateSuccessMessage(
          "create_product",
          {
            ...updated.data,
            productId:
              result.productId,
          }
        );

      return res.json({
        reply,
      });
    }
  }
}

    /*
    ======================================
    NEW REQUEST
    ======================================
    */

    const aiResult =
      await analyzeUserMessage(
        messages
      );

    console.log(
      "AI Result:",
      aiResult
    );

    console.log(
      "AI Result (Formatted):"
    );

    console.log(
      JSON.stringify(
        aiResult,
        null,
        2
      )
    );

    switch (
      aiResult.intent
    ) {
      case "create_customer": {
        const {
          customerName,
        } = aiResult;

        if (
          !customerName
        ) {
          return res.json({
            reply:
              "Please tell me the customer's name.",
          });
        }

        saveSession(
          sessionId,
          {
            workflow:
              "create_customer",

            data: {
              customerName,
            },
          }
        );

        const question =
          await generateFollowUpQuestion(
            "create_customer",
            "dob",
            {
              customerName,
            }
          );

        return res.json({
          reply: question,
        });
      }

      case "create_product": {
        const {
          productName,
        } = aiResult;

        if (
          !productName
        ) {
          return res.json({
            reply:
              "Please tell me the product name.",
          });
        }

        saveSession(
          sessionId,
          {
            workflow:
              "create_product",

            data: {
              productName,
            },
          }
        );

        const question =
          await generateFollowUpQuestion(
            "create_product",
            "productPrice",
            {
              productName,
            }
          );

        return res.json({
          reply: question,
        });
      }

      case "update_customer": {

      const {
        customerName,
        customerNewName,
        email,
        phone,
        location,
        dob,
      } = aiResult;

      if (!customerName) {
        return res.json({
          reply:
            "Which customer would you like to update?",
        });
      }

      const customer =
        await findCustomerByName(
          customerName
        );

      if (!customer) {
        return res.json({
          reply:
            `Customer '${customerName}' was not found.`,
        });
      }

      let fieldName = null;
      let newValue = null;

      if (customerNewName) {
        fieldName =
          "customerName";

        newValue =
          customerNewName;
      }

      else if (email) {
        fieldName =
          "email";

        newValue =
          email;
      }

      else if (phone) {
        fieldName =
          "phone";

        newValue =
          phone;
      }

      else if (location) {
        fieldName =
          "location";

        newValue =
          location;
      }

      else if (dob) {
        fieldName =
          "dob";

        newValue =
          dob;
      }

      if (!fieldName) {
        return res.json({
          reply:
            "What would you like to update for this customer?",
        });
      }

      saveSession(
        sessionId,
        {
          workflow:
            "update_customer_confirmation",

          data: {
            customerName,
            fieldName,
            newValue,
          },
        }
      );

      return res.json({
        reply:
          `I found customer '${customerName}'.

    Do you want me to update '${fieldName}' to '${newValue}'?`,

        actions: [
          {
            id:
              "confirm_update",

            label:
              "✅ Confirm Update",
          },

          {
            id:
              "cancel_update",

            label:
              "❌ Cancel",
          },
        ],
      });
    }
    case "delete_customer": {

  const {
    customerName,
  } = aiResult;

  if (!customerName) {
    return res.json({
      reply:
        "Which customer would you like to delete?",
    });
  }

  const customer =
    await findCustomerByName(
      customerName
    );

  if (!customer) {
    return res.json({
      reply:
        `Customer '${customerName}' was not found.`,
    });
  }

  saveSession(
    sessionId,
    {
      workflow:
        "delete_customer_confirmation",

      data: {
        customerName,
      },
    }
  );

  return res.json({
    reply:
      `I found customer '${customerName}'.

Do you want me to permanently delete this customer?`,

    actions: [
      {
        id:
          "confirm_delete",

        label:
          "🗑 Confirm Delete",
      },

      {
        id:
          "cancel_delete",

        label:
          "❌ Cancel",
      },
    ],
  });
}
case "delete_product": {

  const {
    productName,
  } = aiResult;

  if (!productName) {
    return res.json({
      reply:
        "Which product would you like to delete?",
    });
  }

  const product =
    await findProductByName(
      productName
    );

  if (!product) {
    return res.json({
      reply:
        `Product '${productName}' was not found.`,
    });
  }

  saveSession(
    sessionId,
    {
      workflow:
        "delete_product_confirmation",

      data: {
        productName,
      },
    }
  );

  return res.json({
    reply:
      `I found product '${productName}'.

Do you want me to permanently delete this product?`,

    actions: [
      {
        id:
          "confirm_delete",

        label:
          "🗑 Confirm Delete",
      },

      {
        id:
          "cancel_delete",

        label:
          "❌ Cancel",
      },
    ],
  });
}
      case "update_product": {

  const {
    productName,
    productPrice,
    productQuantity,
  } = aiResult;

  if (!productName) {
    return res.json({
      reply:
        "Which product would you like to update?",
    });
  }

  const product =
    await findProductByName(
      productName
    );

  if (!product) {
    return res.json({
      reply:
        `Product '${productName}' was not found.`,
    });
  }

  let fieldName =
    null;

  let newValue =
    null;

  if (
    productPrice !==
    undefined
  ) {
    fieldName =
      "productPrice";

    newValue =
      productPrice;
  }

  else if (
    productQuantity !==
    undefined
  ) {
    fieldName =
      "productQuantity";

    newValue =
      productQuantity;
  }

  if (!fieldName) {
    return res.json({
      reply:
        "What would you like to update for this product?",
    });
  }

  saveSession(
    sessionId,
    {
      workflow:
        "update_product_confirmation",

      data: {
        productName,
        fieldName,
        newValue,
      },
    }
  );

  return res.json({
    reply:
      `I found product '${productName}'.

Do you want me to update '${fieldName}' to '${newValue}'?`,

    actions: [
      {
        id:
          "confirm_update",

        label:
          "✅ Confirm Update",
      },

      {
        id:
          "cancel_update",

        label:
          "❌ Cancel",
      },
    ],
  });
}

      case "show_customers": {
        const customers =
          await getCustomers();

        return res.json({
          reply:
            await generateResponse(
              `
Show these customers to the user:

${JSON.stringify(
  customers,
  null,
  2
)}
`
            ),
        });
      }

      case "show_products": {
        const products =
          await getProducts();

        return res.json({
          reply:
            await generateResponse(
              `
Show these products to the user:

${JSON.stringify(
  products,
  null,
  2
)}
`
            ),
        });
      }

      case "dashboard_stats": {
        const stats =
          await getDashboardStats();

        return res.json({
          reply:
            await generateResponse(
              `
Explain these dashboard stats:

${JSON.stringify(
  stats,
  null,
  2
)}
`
            ),
        });
      }

      default: {
  const reply =
    await generateConversationalResponse(
      messages
    );

  return res.json({
    reply,
  });
}
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to process assistant request",
    });
  }
}

module.exports = {
  chatWithAssistant,
};
