import express from "express";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, "..", "dist")));

// Catch-all handler to serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
