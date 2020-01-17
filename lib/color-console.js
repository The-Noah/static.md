const reset = "\x1b[0m";

module.exports.log = (text) => {
  console.log(text);
}

module.exports.error = (text) => {
  console.log("\x1b[31me ", text, reset);
}

module.exports.success = (text) => {
  console.log("\x1b[32m+ ", text, reset);
}

module.exports.warning = (text) => {
  console.log("\x1b[33m! ", text, reset);
}

module.exports.info = (text) => {
  console.log("\x1b[36mi ", text, reset);
}