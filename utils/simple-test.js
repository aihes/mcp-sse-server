import express from "express";

const app = express();

app.get("/", (req, res) => {
  console.log("Received request to /");
  res.send("Hello World!");
});

const port = 3005;
app.listen(port, () => {
  console.log(`Simple test server running on http://localhost:${port}`);
});
