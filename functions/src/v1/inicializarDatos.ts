// Data initialization (v1) removed during migration to MongoDB.
export async function inicializarDatos(): Promise<void> {
  throw new Error('inicializarDatos removed: use v2 migration scripts and MongoDB repositories.');
}

export default inicializarDatos;
