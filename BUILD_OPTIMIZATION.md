# Build Optimization Guide

This project includes optimizations to speed up iOS builds.

## Quick Commands

### Fast Build (Recommended)
```bash
npm run ios:fast
```
This uses parallel compilation and keeps Metro cache.

### Clean Build (Only when needed)
```bash
npm run ios:clean
```
Use this when you have dependency changes or need a fresh build.

### Standard Build
```bash
npm run ios
```
Standard React Native build (slower but compatible).

## Optimizations Enabled

### 1. **Parallel Compilation**
- Uses all CPU cores automatically (`-jobs $(sysctl -n hw.ncpu)`)
- Xcode builds multiple targets simultaneously
- Pods compile in parallel

### 2. **Metro Bundler Cache**
- Persistent cache in `node_modules/.cache/metro`
- Incremental builds for JS changes
- Faster hot reloading

### 3. **Xcode Build Settings**
- Module stability enabled for faster incremental builds
- Whole module optimization for Swift
- Index store enabled for faster navigation
- Library distribution enabled for better caching

### 4. **Incremental Builds**
- Only rebuilds changed files
- Derived data caching enabled
- No full clean unless requested

## Tips for Even Faster Builds

1. **Keep Metro Running**: Don't kill Metro between builds
   ```bash
   npm start
   # Then in another terminal:
   npm run ios:fast
   ```

2. **Use Simulator**: Physical devices require code signing (slower)

3. **Clean Only When Needed**: Only use `--clean` when:
   - Dependency changes
   - Native module changes
   - Xcode cache corruption

4. **Disable Code Signing in Dev** (Already configured):
   - `CODE_SIGNING_ALLOWED=NO` in fast build script
   - Faster development builds

5. **Watchman for File Changes**:
   ```bash
   brew install watchman
   ```
   Helps Metro detect file changes faster

## Build Time Comparison

- **Standard Build**: ~5-10 minutes (full rebuild)
- **Fast Build**: ~2-3 minutes (incremental)
- **Hot Reload**: <5 seconds (JS only changes)

## Troubleshooting

If builds are slow:
1. Clear derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
2. Reinstall pods: `cd ios && pod install`
3. Restart Metro: `npm start -- --reset-cache`
