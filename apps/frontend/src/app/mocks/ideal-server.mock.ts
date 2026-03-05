import { IdealPayload } from '../models/ideal-server.model';

export const IDEAL_SERVER_MOCK: IdealPayload = [
  {
    id: 'canal-1',
    name: 'Canal Uno',
    icon: '/assets/images/canal-1.png',
    programs: [
      {
        id: 'p-1',
        title: 'Noticiero Central',
        startMinutes: 20 * 60, // 20:00
        endMinutes: 21 * 60, // 21:00
        durationMinutes: 60,
        categories: ['news'],
        description: 'Resumen de noticias',
      },
      {
        id: 'p-2',
        title: 'Película Estelar',
        startMinutes: 21 * 60, // 21:00
        endMinutes: 23 * 60 + 30, // 23:30
        durationMinutes: 150,
        categories: ['movie', 'feature'],
        description: 'Película de estreno',
      },
    ],
  },
  {
    id: 'canal-2',
    name: 'Canal Dos',
    icon: '/assets/images/canal-2.png',
    programs: [
      {
        id: 'p-3',
        title: 'Serie Popular',
        startMinutes: 19 * 60 + 30,
        endMinutes: 20 * 60 + 30,
        durationMinutes: 60,
        categories: ['series'],
      },
    ],
  },
];
