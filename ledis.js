var stores = {};

exports.get = function (key) {
  return stores[key] || "(nil)";
};

exports.set = function (key, value) {
  stores[key] = value;
  return "OK";
};
