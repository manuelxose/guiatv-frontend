// actualizarProgramacion (v1) removed during migration. Use v2 jobs.
export async function actualizarProgramacion(): Promise<void> {
  throw new Error('actualizarProgramacion removed: use v2 jobs with MongoDB.');
}

export default actualizarProgramacion;
