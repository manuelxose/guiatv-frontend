// Legacy v1 API routes removed during migration away from Firebase/GCS.
// These stubs keep the module in place so TypeScript builds succeed and
// callers receive a clear error indicating migration.

export async function obtenerProgramacion(): Promise<any> {
  throw new Error('v1 API removed: use v2 API. Configure DB_ADAPTER=mongo and STORAGE_ADAPTER=local or s3.');
}

export const Programa = {} as any;
