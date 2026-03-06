import axios, { AxiosInstance } from 'axios';

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotContext {
  userId: string;
  userProfile: {
    name: string;
    favoriteGenres: string[];
    topRatedContent: Array<{ title: string; rating: number; type: string }>;
    recentlyWatched: Array<{ title: string; platform?: string }>;
    preferredPlatforms: string[];
    avgRating: number;
  };
  availableTonight?: Array<{
    title: string;
    channel: string;
    time: string;
    genre: string;
    tmdbRating?: number;
  }>;
}

export interface ChatbotResponse {
  text: string;
  recommendations?: Array<{
    catalogId?: string;
    source?: 'program' | 'tmdb';
    title: string;
    type: 'movie' | 'series' | 'program';
    platform?: string;
    channel?: string;
    time?: string;
    reason: string;
    tmdbId?: number;
    image?: string;
  }>;
  followUpSuggestions?: string[];
}

export class AIRecommendationService {
  private readonly client: AxiosInstance;
  private readonly model =
    process.env.AI_CHATBOT_MODEL || 'claude-opus-4-1';

  constructor(private readonly apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      timeout: 20000,
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    });
  }

  async chat(
    messages: ChatbotMessage[],
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    const response = await this.client.post('/messages', {
      model: this.model,
      max_tokens: 1024,
      system: this.buildSystemPrompt(context),
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const text = Array.isArray(response.data?.content)
      ? response.data.content
          .map((block: any) => String(block?.text || '').trim())
          .filter(Boolean)
          .join('\n')
      : '';

    return this.parseResponse(text);
  }

  private buildSystemPrompt(context: ChatbotContext): string {
    const { userProfile, availableTonight } = context;

    return `Eres el asistente de recomendaciones de Guia TV, una app espanola de television y streaming.

Tu objetivo es ayudar a ${userProfile.name} a decidir que ver basandote EXCLUSIVAMENTE en sus gustos reales y el contenido disponible.

## PERFIL DEL USUARIO
- Generos favoritos: ${userProfile.favoriteGenres.join(', ') || 'No especificados todavia'}
- Plataformas disponibles: ${userProfile.preferredPlatforms.join(', ') || 'No especificadas'}
- Puntuacion media que da: ${userProfile.avgRating}/10
- Contenido mejor valorado: ${userProfile.topRatedContent
  .slice(0, 5)
  .map((item) => `${item.title} (${item.rating}/10)`)
  .join(', ') || 'Sin valoraciones todavia'}
- Visto recientemente: ${userProfile.recentlyWatched
  .slice(0, 5)
  .map((item) => item.title)
  .join(', ') || 'Sin historial'}

## ESTA NOCHE EN TV
${availableTonight?.slice(0, 10)
  .map(
    (program) =>
      `- ${program.time} en ${program.channel}: "${program.title}" [${program.genre}]${
        program.tmdbRating ? ` (TMDB: ${program.tmdbRating}/10)` : ''
      }`
  )
  .join('\n') || 'No hay datos de programacion disponibles'}

## INSTRUCCIONES
1. Responde SIEMPRE en espanol
2. Se conciso y directo, maximo 3 recomendaciones por respuesta
3. Explica brevemente por que recomiendas cada cosa
4. Si el usuario pregunta por algo muy especifico, se honesto si no lo sabes
5. Sugiere tanto contenido en TV de esta noche como en plataformas de streaming
6. No inventes contenido que no existe
7. RESPONDE SIEMPRE en este formato JSON:
{
  "text": "mensaje conversacional para el usuario",
  "recommendations": [
    {
      "title": "Nombre exacto",
      "type": "movie|series|program",
      "platform": "Netflix|Prime Video|TV|etc",
      "channel": "Nombre canal si es TV",
      "time": "HH:MM si es TV esta noche",
      "reason": "una linea explicando por que"
    }
  ],
  "followUpSuggestions": ["¿Quieres algo más de accion?", "¿Prefieres una serie corta?"]
}`;
  }

  private parseResponse(text: string): ChatbotResponse {
    try {
      const clean = String(text || '').replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return {
        text: text || 'No pude estructurar la respuesta del asistente.',
        recommendations: [],
        followUpSuggestions: [],
      };
    }
  }
}
