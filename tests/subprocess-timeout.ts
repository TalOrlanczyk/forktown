/**
 * Budget for tests that start Git or Node processes. Their wall-clock time depends on
 * process startup and on how busy the machine is while the whole suite runs in parallel,
 * which can exceed Vitest's 5-second default, especially on Windows.
 */
export const SUBPROCESS_TIMEOUT = 30_000;
/** Test and suite options that apply {@link SUBPROCESS_TIMEOUT}. */
export const SUBPROCESS_TEST = { timeout: SUBPROCESS_TIMEOUT };
