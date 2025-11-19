// Legacy v1 firestore utilities removed during migration to MongoDB.
// Keep stubs so any accidental imports fail clearly at runtime.

export async function guardarCanalesEnFirestore(): Promise<Map<string, string>> {
  throw new Error('guardarCanalesEnFirestore removed: use the v2 MongoDB-based repositories.');
}

export async function guardarProgramasEnFirestore(): Promise<void> {
  throw new Error('guardarProgramasEnFirestore removed: use v2 migration scripts.');
}

export async function datosInicialesCargados(): Promise<boolean> {
  throw new Error('datosInicialesCargados removed: use v2 migration scripts.');
}

export async function moverCanalesEspana(): Promise<boolean> {
  throw new Error('moverCanalesEspana removed: use v2 migration scripts.');
}
