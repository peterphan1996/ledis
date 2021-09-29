var stores = {};
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
  if (!Array.isArray(values)) {
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
  console.log(`list`, list);
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
  const formattedResult = result.map(function (item, index) {
    return `${index + 1}) "${item}"`;
  });
  return formattedResult;
};
