// Windows SUBST preserves the existing checkout while avoiding '#' in Vite URLs.
// Native realpath expands SUBST drives; Node's portable realpath retains them.
// Scoped to the child development/build process, never edits dependency files.
const fs = require('node:fs');
if (process.platform === 'win32' && process.env.GYM_SUBST_ROOT) {
  const native = fs.realpathSync.native;
  fs.realpathSync.native = function (path, options) {
    const result = native(path, options);
    const physical = process.env.GYM_SUBST_ROOT;
    return typeof result === 'string' &&
      (result.toLowerCase() === physical.toLowerCase() ||
        result.toLowerCase().startsWith(physical.toLowerCase() + '\\'))
      ? (process.env.GYM_ALIAS_ROOT || process.cwd().slice(0, 2)) +
          result.slice(physical.length)
      : result;
  };
}
