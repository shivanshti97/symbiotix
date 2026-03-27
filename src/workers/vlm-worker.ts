/**
 * VLM Web Worker — runs all vision+language inference off the main thread.
 * Bundled by Vite as a standalone worker chunk via `?worker&url` import.
 */
import { startVLMWorkerRuntime } from '@runanywhere/web-llamacpp';

startVLMWorkerRuntime();
