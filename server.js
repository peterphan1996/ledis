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
  res.send({ data: result });
});

app.get("/", (req, res) => {
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
      // String GET, SET
      case "get": {
        const { key } = utils.parseGetArgs(argsString);
        return ledis.get(key) || "(nil)";
      }
      case "set": {
        const { key, value } = utils.parseSetArgs(argsString);
        return ledis.set(key, value);
      }
      // List LLEN, RPUSH, RPOP, LPOP, LRANGE
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
      // Set SADD, SREM, SMEMBERS, SINTER
      case "sadd": {
        const { key, values } = utils.parseSAddArgs(argsString);
        return ledis.sadd(key, values);
      }
      case "srem": {
        const { key, values } = utils.parseSRemArgs(argsString);
        return ledis.srem(key, values);
      }
      case "smembers": {
        const { key } = utils.parseSMembersArgs(argsString);
        return ledis.smembers(key);
      }
      case "sinter": {
        const { keys } = utils.parseSInterArgs(argsString);
        return ledis.sinter(keys);
      }
      // Data Expiration KEYS, DEL, EXPIRE, TTL
      case "keys": {
        return ledis.keys();
      }
      case "del": {
        const { key } = utils.parseDelArgs(argsString);
        return ledis.del(key);
      }
      case "expire": {
        const { key, seconds } = utils.parseExpireArgs(argsString);
        return ledis.expire(key, seconds);
      }
      case "ttl": {
        const { key } = utils.parseTtlArgs(argsString);
        return ledis.ttl(key);
      }
      // Snapshot Save, Restore
      case "save": {
        return ledis.save();
      }
      case "restore": {
        return ledis.restore();
      }
      // Bonus: Flushall
      case "flushall": {
        return ledis.flushall();
      }
      default:
        return "ERROR: unhandled command";
    }
  } catch (error) {
    console.log(`error`, error);
    return "ERROR";
  }
}
