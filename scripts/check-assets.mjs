#!/usr/bin/env node
// Entry point required by queue entry 4; the implementation is tools/check-assets.mjs (entry 3).
// Both paths run the same program: `node tools/check-assets.mjs` and `npm run check:assets`.
import { run } from '../tools/check-assets.mjs';

process.exit(run(process.cwd()));
