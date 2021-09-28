const regex = /(\w+)\s(.+)/;

exports.parseCommand = function (command) {
  const match = regex.exec(command);
  if (match) {
    return {
      command: match[1],
      args: match[2],
    };
  }
};

exports.parseSetArgs = function (args) {
  const parsedArgs = this.parseArgs(args);
  if (parsedArgs.length !== 2) throw Error;
  return {
    key: parsedArgs[0],
    value: parsedArgs[1],
  };
};

exports.parseGetArgs = function (args) {
  const parsedArgs = this.parseArgs(args);
  if (parsedArgs.length !== 1) throw Error;
  return parsedArgs[0];
};

exports.parseArgs = function (argsString) {
  let beginArg = false;
  const args = [];
  let arg = "";
  for (var idx = 0; idx < argsString.length; ++idx) {
    const char = argsString[idx];
    if ((char === `"` || char === `'`) && !beginArg) {
      beginArg = true;
      continue;
    }

    if ((char === `"` || char === `'`) && beginArg) {
      beginArg = false;
      args.push(arg);
      arg = "";
      continue;
    }

    if (char === " " && !beginArg) {
      arg && args.push(arg);
      arg = "";
      continue;
    }

    arg += char;

    if (idx === argsString.length - 1) {
      arg && args.push(arg);
    }
  }
  return args;
};
