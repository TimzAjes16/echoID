// Mock path module for React Native
module.exports = {
  join: (...args) => args.join('/'),
  resolve: (...args) => args.join('/'),
  dirname: (p) => p.split('/').slice(0, -1).join('/') || '.',
  basename: (p) => p.split('/').pop() || '',
  extname: (p) => {
    const parts = p.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  },
};
module.exports.default = module.exports;
