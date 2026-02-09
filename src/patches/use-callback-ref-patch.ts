/**
 * Vite plugin to patch use-callback-ref's useMergeRef.js files
 * which use `import * as React` + `React.useLayoutEffect` pattern
 * that breaks when React namespace isn't fully available.
 * 
 * This replaces React.useLayoutEffect / React.useEffect with direct imports.
 */
import type { Plugin } from 'vite';

export function patchUseCallbackRef(): Plugin {
  return {
    name: 'patch-use-callback-ref',
    enforce: 'pre',
    transform(code, id) {
      // Match ANY file in use-callback-ref that references React.useLayoutEffect
      if (!id.includes('use-callback-ref')) {
        return null;
      }

      if (!code.includes('React.useLayoutEffect') && !code.includes('React.useEffect')) {
        return null;
      }

      let patched = code;

      // For ES module files: replace `import * as React from 'react'`
      patched = patched.replace(
        /import \* as React from ['"]react['"]/,
        "import React, { useLayoutEffect as _useLayoutEffect, useEffect as _useEffect } from 'react'"
      );

      // For CJS files: add named imports after the __importStar line
      if (patched.includes('__importStar')) {
        // The CJS version already has React via __importStar, just need to add the hook extractions
        const insertPoint = patched.indexOf('var useIsomorphicLayoutEffect');
        if (insertPoint !== -1) {
          patched = patched.slice(0, insertPoint) +
            'var _useLayoutEffect = React.useLayoutEffect || require("react").useLayoutEffect;\n' +
            'var _useEffect = React.useEffect || require("react").useEffect;\n' +
            patched.slice(insertPoint);
        }
      }

      // Replace the problematic ternary that accesses React.useLayoutEffect/React.useEffect
      patched = patched.replace(
        /(?:var|const|let)\s+useIsomorphicLayoutEffect\s*=\s*typeof\s+window\s*!==\s*['"]undefined['"]\s*\?\s*React\.useLayoutEffect\s*:\s*React\.useEffect\s*;/,
        "var useIsomorphicLayoutEffect = typeof window !== 'undefined' ? _useLayoutEffect : _useEffect;"
      );

      if (patched !== code) {
        return { code: patched, map: null };
      }
      return null;
    },
  };
}
