const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const ledis = require("./ledis");
const utils = require("./utils");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// eslint-disable-next-line no-undef
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));

// Serve static files from the React app
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "client/build")));

app.post("/", (req, res) => {
  const result = handleRequest(req);
  console.log(`result`, result);
  res.send({ data: result });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  // eslint-disable-next-line no-undef
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

function handleRequest(req) {
  try {
    if (!req.body.command) return "ERROR";
    const result = utils.parseCommand(req.body.command);

    if (!result) return "ERROR";
    const { command, args: argsString } = result;

    switch (command.toLowerCase()) {
      case "get": {
        const { key } = utils.parseGetArgs(argsString);
        return ledis.get(key) || "(nil)";
      }
      case "set": {
        const { key, value } = utils.parseSetArgs(argsString);
        return ledis.set(key, value);
      }
      case "llen": {
        const { key } = utils.parseLLenArgs(argsString);
        return ledis.llen(key);
      }
      case "rpush": {
        const { key, values } = utils.parseRPushArgs(argsString);
        return ledis.rpush(key, values);
      }
      case "lpop": {
        const { key } = utils.parseLPopArgs(argsString);
        return ledis.lpop(key);
      }
      case "rpop": {
        const { key } = utils.parseRPopArgs(argsString);
        return ledis.rpop(key);
      }
      case "lrange": {
        const { key, start, end } = utils.parseLRangeArgs(argsString);
        return ledis.lrange(key, start, end);
      }
      default:
        console.log("unhandled command");
        return "ERROR";
    }
  } catch (error) {
    return "ERROR";
  }
}
