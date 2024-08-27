const express = require("express");
const Groq = require("groq-sdk");
const path = require("path");
const Razorpay = require("razorpay");
require("dotenv").config();

const ApiKey = process.env.GROQ_KEY;
// Initialize Groq with your API key
const groq = new Groq({ apiKey: ApiKey });

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serves static files from the 'public' directory

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.post("/generate-code", async (req, res) => {
  const { prompt } = req.body;

  // Prepare the prompt with context
  // const promptWithContext = `Generate complete HTML and CSS code complete not just sections but complete code in single file itself code for the following component, without any explanations just code: ${prompt}`;
  const promptWithContext = `Generate a complete, single-file HTML document with embedded CSS for the following component. Provide all necessary HTML and CSS code together in one file. Do not include any explanations—just the code. The component to generate is: ${prompt}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: promptWithContext }],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
      stream: false,
      stop: null,
    });

    let code = chatCompletion.choices[0]?.message?.content || "";

    // Clean up the code by removing any extraneous characters
    code = code
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");

    // Send only the code without any JSON formatting
    res.send(code);
  } catch (error) {
    console.error("Error generating code:", error);
    res
      .status(500)
      .send(`Error generating code: ${error.message || "Unknown error"}`);
  }
});

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

app.post('/create-subscription', async (req, res) => {
    const { customerEmail } = req.body;
    const planId = process.env.PLAN_ID; // Use the PLAN_ID from environment variables
  
    const subscriptionParams = {
      plan_id: planId, // Use the actual plan ID from the plan creation response
      total_count: 12, // Number of billing cycles
      customer_notify: 1,
      notes: { customer_email: customerEmail },
    };
  
    try {
      const subscription = await razorpay.subscriptions.create(subscriptionParams);
      res.json({ subscriptionId: subscription.id });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).send('Error creating subscription');
    }
  });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});