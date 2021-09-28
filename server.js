const express = require("express");
const bodyParser = require("body-parser");
var ledis = require("./ledis");
var utils = require("./utils");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));

app.post("/", (req, res) => {
  const result = handleRequest(req);
  res.send({ data: result });
});

function handleRequest(req) {
  try {
    if (!req.body.command) return "ERROR";
    const result = utils.parseCommand(req.body.command);

    if (!result) return "ERROR";
    const { command, args: argsString } = result;

    switch (command.toLowerCase()) {
      case "get": {
        const key = utils.parseGetArgs(argsString);
        return ledis.get(key);
      }
      case "set": {
        const { key, value } = utils.parseSetArgs(argsString);
        return ledis.set(key, value);
      }
      default:
        console.log("unhandled command");
        return "ERROR";
    }
  } catch (error) {
    return "ERROR";
  }
}
