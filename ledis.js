const fs = require("fs");

var stores = {};
var expire = {};

exports.has = function (key) {
  return !!stores[key];
};

// String
exports.get = function (key) {
  return stores[key] || null;
};

exports.set = function (key, value) {
  stores[key] = value;
  return "OK";
};

// List
exports.llen = function (key) {
  if (!this.has(key)) {
    return "(integer) 0";
  }

  const list = this.get(key);
  if (!Array.isArray(list)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  return list.length;
};

exports.rpush = function (key, values) {
  if (!this.has(key)) {
    this.set(key, []);
  }

  const list = this.get(key);
  if (!Array.isArray(values)) {
    return "ERROR: unsupported argument";
  }

  if (!Array.isArray(list)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  list.push(...values);
  this.set(key, list);
  return `(integer) ${list.length}`;
};

exports.rpop = function (key) {
  if (!this.has(key)) {
    return "(nil)";
  }

  const list = this.get(key);
  if (!Array.isArray(list)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  if (list.length == 0) {
    return "(nil)";
  }

  return list.pop();
};

exports.lpop = function (key) {
  if (!this.has(key)) {
    return null;
  }

  const list = this.get(key);
  if (!Array.isArray(list)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  if (list.length == 0) {
    return "(nil)";
  }

  return list.shift();
};

exports.lrange = function (key, start, end) {
  if (!this.has(key)) {
    return "(empty array)";
  }
  const list = this.get(key);

  // Redis actually accept negative "end" value
  // But for the requirement and simplicity, we just require non-negative value
  if (!list || !Array.isArray(list) || start < 0 || end < 0) {
    return "ERROR";
  }

  const startInt = parseInt(start);
  const endInt = parseInt(end) + 1;

  const result = list.slice(startInt, endInt);

  return formatArrayResponse(result);
};

// Set
exports.sadd = function (key, values) {
  let set = this.get(key);

  if (!set) {
    set = {};
  }

  if (!isSet(set)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  let addedValues = 0;
  values.forEach((element) => {
    if (!set[element]) {
      addedValues++;
      set[element] = true;
    }
  });

  this.set(key, set);
  return `(integer) ${addedValues}`;
};

exports.srem = function (key, values) {
  const set = this.get(key);

  if (!isSet(set)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  let removedValues = 0;
  values.forEach((element) => {
    if (set[element]) {
      removedValues++;
      delete set[element];
    }
  });

  return `(integer) ${removedValues}`;
};

exports.smembers = function (key) {
  let set = this.get(key);
  if (!set) {
    set = {};
  }

  if (!isSet(set)) {
    return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
  }

  // Format response
  return formatArrayResponse(Object.keys(set));
};

exports.sinter = function (keys) {
  if (!Array.isArray(keys)) {
    return "ERROR";
  }

  // validation sets
  for (const key of keys) {
    let set = this.get(key);
    if (!set) {
      set = {};
    }
    if (!isSet(set)) {
      return "ERROR: WRONGTYPE Operation against a key holding the wrong kind of value";
    }
    if (Object.keys(set).length === 0) {
      return "(empty array)";
    }
  }

  const allMembers = keys.map((key) => {
    let set = this.get(key);
    if (!set) {
      set = {};
    }
    return Object.keys(set);
  });
  const intersection = intersect(...allMembers);

  // Format response
  return formatArrayResponse(intersection);
};

exports.keys = function () {
  return formatArrayResponse(Object.keys(stores));
};

exports.del = function (key) {
  let deleted = 0;
  if (this.has(key)) {
    delete stores[key];
    deleted++;
  }

  return deleted;
};

exports.expire = function (key, seconds) {
  if (isNaN(parseInt(seconds))) {
    return "(error) ERR value is not an integer";
  }

  if (!this.has(key)) {
    return "(integer) 0";
  }

  if (expire[key] && expire[key].timeoutId) {
    clearTimeout(expire[key].timeoutId);
    clearInterval(expire[key].intervalId);
  }

  expire[key] = {
    timeout: parseInt(seconds),
    timeoutId: setTimeout(() => {
      // delete expire[key];
      delete stores[key];
    }, seconds * 1000),
  };

  expire[key].intervalId = setInterval(() => {
    if (expire[key].timeout <= 0) {
      clearInterval(expire[key].intervalId);
      expire[key].timeout = -2;
      return;
    }
    expire[key].timeout--;
  }, 1000);

  return "(integer) 1";
};

exports.ttl = function (key) {
  if (this.has(key) && !expire[key]) {
    return "(integer) -1";
  }

  if (!this.has(key) && !expire[key]) {
    return "(integer) -2";
  }

  return `"(integer) ${expire[key].timeout}"`;
};

// Redis has dump.rdb as default file name, for Ledis we'll use dump.ldb
const dumpFile = "dump.ldb";

exports.save = function () {
  const data = JSON.stringify(stores);
  fs.writeFileSync(dumpFile, data);
  return "OK";
};

exports.restore = function () {
  try {
    const rawData = fs.readFileSync(dumpFile);
    stores = JSON.parse(rawData);
    return "OK";
  } catch (error) {
    return "ERROR: no dump file";
  }
};

// Bonus: Flushall
exports.flushall = function () {
  stores = {};

  return "OK";
};

// utils
function isSet(set) {
  if (Array.isArray(set)) {
    return false;
  }

  // Filter null
  return set !== null && typeof set === "object";
}

function intersect(...a) {
  return [...a].reduce((previous, current) =>
    previous.filter((element) => current.includes(element))
  );
}

function formatArrayResponse(array) {
  if (array.length === 0) {
    return "(empty array)";
  }

  const formattedResult = array.map(function (item, index) {
    return `${index + 1}) "${item}"`;
  });
  return formattedResult;
}
