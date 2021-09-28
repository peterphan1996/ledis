const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));

app.post("/", (req, res) => {
  res.send({ data: "POST DATA" });
});
