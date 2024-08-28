require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");
const path = require("path");
const Razorpay = require("razorpay");
const cookieSession = require("cookie-session");
const session = require("express-session");
const passport = require("./passport");
const cors = require("cors");
const authRoute = require("./routes/auth"); // Define auth route separately

// Groq API setup
const groq = new Groq({ apiKey: process.env.GROQ_KEY });

const app = express();
const port = 3000;

// Middleware for handling JSON, cookies, and CORS
// app.use(express.json());
// app.use(
//   cookieSession({
//     name: "session",
//     keys: ["cyberwolve"],
//     maxAge: 24 * 60 * 60 * 1000,
//   })
// );

app.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, "public"))); // Serves static files

// Use the auth routes for authentication-related requests
app.use("/auth", authRoute);

app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

// Google OAuth callback route
app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Successful authentication
    res.redirect("http://localhost:3000/");
  }
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.post("/generate-code", async (req, res) => {
  const { prompt } = req.body;

  const promptWithContext = `Generate a complete, single-file HTML document with embedded CSS for the following component. Provide all necessary HTML and CSS code together in one file. Do not include any explanations—just the code. The component to generate is: ${prompt}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: promptWithContext }],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
    });

    let code = chatCompletion.choices[0]?.message?.content || "";
    code = code
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");

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

app.post("/create-subscription", async (req, res) => {
  const { customerEmail } = req.body;
  const planId = process.env.PLAN_ID;

  const subscriptionParams = {
    plan_id: planId,
    total_count: 12,
    customer_notify: 1,
    notes: { customer_email: customerEmail },
  };

  try {
    const subscription = await razorpay.subscriptions.create(
      subscriptionParams
    );
    res.json({ subscriptionId: subscription.id });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).send("Error creating subscription");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
