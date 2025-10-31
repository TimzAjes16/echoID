// Mock os module for React Native
module.exports = {
  tmpdir: () => '/tmp',
  platform: () => 'ios',
  arch: () => 'arm64',
};
module.exports.default = module.exports;
