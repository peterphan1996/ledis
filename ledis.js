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
    return 0;
  }

  const list = this.get(key);
  if (!Array.isArray(list)) {
    return false;
  }

  return list.length;
};

exports.rpush = function (key, values) {
  if (!this.has(key)) {
    this.set(key, []);
  }

  const list = this.get(key);
  if (!Array.isArray(values) || !Array.isArray(list)) {
    return false;
  }

  list.push(...values);
  this.set(key, list);
  return list.length;
};

exports.rpop = function (key) {
  if (!this.has(key)) {
    return null;
  }

  const list = this.get(key);
  if (!Array.isArray(list)) {
    return false;
  }

  if (list.length == 0) {
    return null;
  }

  return list.pop();
};

exports.lpop = function (key) {
  if (!this.has(key)) {
    return null;
  }

  const list = this.get(key);
  if (!Array.isArray(list)) {
    return false;
  }

  if (list.length == 0) {
    return null;
  }

  return list.shift();
};

exports.lrange = function (key, start, end) {
  if (!this.has(key)) {
    return null;
  }
  const list = this.get(key);

  // Redis actually accept negative "end" value
  // But for the requirement and simplicity, we just require non-negative value
  if (!list || !Array.isArray(list) || start < 0 || end < 0) {
    return null;
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
    return "ERROR";
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
    return false;
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
    return false;
  }

  // Format response
  const formattedResult = Object.keys(set).map(function (item, index) {
    return `${index + 1}) "${item}"`;
  });
  return formattedResult;
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
      return "(error) WRONGTYPE Operation against a key holding the wrong kind of value";
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
