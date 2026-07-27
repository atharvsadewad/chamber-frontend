import express from 'express';
import handler from './api/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome route for status check in browser
app.get('/', (req, res) => {
  res.json({
    status: "Chamber Backend is running locally!",
    activeEndpoints: {
      "POST /api/chat": "Accepts { message: string } to communicate with Gemini AI"
    }
  });
});

// Route all requests to /api/chat to the Vercel handler
app.all('/api/chat', async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error("Express wrapper error:", error);
    res.status(500).json({ error: "Internal Server Error in wrapper" });
  }
});

app.listen(PORT, () => {
  console.log(`Chamber Backend runner active on http://localhost:${PORT}`);
});
