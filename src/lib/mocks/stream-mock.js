// Mock stream module for React Native
module.exports = {
  Readable: class Readable {},
  Writable: class Writable {},
  Transform: class Transform {},
  Duplex: class Duplex {},
};
module.exports.default = module.exports;
