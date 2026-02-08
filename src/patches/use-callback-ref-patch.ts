/**
 * Vite plugin to patch use-callback-ref's useMergeRef.js files
 * which use `import * as React` + `React.useLayoutEffect` pattern
 * that breaks when React namespace isn't fully available.
 * 
 * This replaces `import * as React from 'react'` with direct named imports
 * and swaps `React.useLayoutEffect` / `React.useEffect` references.
 */
import type { Plugin } from 'vite';

export function patchUseCallbackRef(): Plugin {
  return {
    name: 'patch-use-callback-ref',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('use-callback-ref') || !id.includes('useMergeRef')) {
        return null;
      }

      // Replace `import * as React from 'react'` with named imports
      let patched = code.replace(
        /import \* as React from ['"]react['"]/,
        "import { useLayoutEffect, useEffect } from 'react'"
      );

      // Replace React.useLayoutEffect and React.useEffect references
      patched = patched.replace(/React\.useLayoutEffect/g, 'useLayoutEffect');
      patched = patched.replace(/React\.useEffect/g, 'useEffect');

      if (patched !== code) {
        return { code: patched, map: null };
      }
      return null;
    },
  };
}
