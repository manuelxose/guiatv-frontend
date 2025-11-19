// downloadData (v1) stubbed during migration away from GCS.
export async function downloadData(): Promise<void> {
  throw new Error('downloadData (v1) removed: use v2 migration scripts or configure STORAGE_ADAPTER=local/s3.');
}

export default downloadData;
