/**
 * Modelo ideal que el servidor debería enviar para minimizar el procesamiento
 * en el cliente. Evita conversiones en tiempo de ejecución y contiene campos
 * ya normalizados (minutos numéricos, arrays de categorías, títulos simples).
 */
export interface IdealProgram {
  id: string;
  title: string;
  startMinutes: number; // minutos desde 00:00 local
  endMinutes: number; // minutos desde 00:00 local
  durationMinutes: number; // end - start
  categories: string[];
  description?: string;
  poster?: string;
  rating?: string | number;
  // campos adicionales permitidos por compatibilidad
  [k: string]: any;
}

export interface IdealChannel {
  id: string;
  name: string;
  icon?: string;
  programs: IdealProgram[];
  [k: string]: any;
}

export type IdealPayload = IdealChannel[];
