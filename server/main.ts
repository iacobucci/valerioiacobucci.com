import express from "express";

const app = express();

// serve public folder

app.get("/api/ciao", (req, res) => {res.send("ciao")});

app.use(express.static("public"));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
