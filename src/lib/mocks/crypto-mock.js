// Mock crypto module - use expo-crypto instead in React Native
module.exports = {
  randomBytes: (size) => {
    const arr = new Uint8Array(size);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < size; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
    }
    return Buffer.from(arr);
  },
  createHash: () => ({
    update: () => ({digest: () => ''}),
  }),
};
module.exports.default = module.exports;
