/**
 * MOCK DATA COMPLETO PARA TESTING
 * Ubicación: src/app/mocks/program-guide-mock.data.ts
 *
 * Incluye datos realistas para probar la guía de programación
 */

export const MOCK_CHANNELS = [
  {
    id: 'tve1',
    name: 'La 1',
    logo: 'https://graph.facebook.com/la1tve/picture?type=large',
    number: 1,
  },
  {
    id: 'la2',
    name: 'La 2',
    logo: 'https://graph.facebook.com/la2tve/picture?type=large',
    number: 2,
  },
  {
    id: 'antena3',
    name: 'Antena 3',
    logo: 'https://graph.facebook.com/antena3/picture?type=large',
    number: 3,
  },
  {
    id: 'cuatro',
    name: 'Cuatro',
    logo: 'https://graph.facebook.com/cuatro/picture?type=large',
    number: 4,
  },
  {
    id: 'telecinco',
    name: 'Telecinco',
    logo: 'https://graph.facebook.com/telecinco/picture?type=large',
    number: 5,
  },
  {
    id: 'lasexta',
    name: 'La Sexta',
    logo: 'https://graph.facebook.com/lasexta/picture?type=large',
    number: 6,
  },
];

export const MOCK_PROGRAMS = {
  // FRANJA 0: 00:00 - 03:00
  slot0: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog001',
          title: 'Cine de madrugada',
          start: '00:00',
          stop: '02:15',
          category: 'movie',
          description: 'Película clásica española',
          rating: '7.5',
        },
        {
          id: 'prog002',
          title: 'Noticias 24h',
          start: '02:15',
          stop: '03:00',
          category: 'news',
          description: 'Informativo',
        },
      ],
    },
    {
      channelId: 'antena3',
      programs: [
        {
          id: 'prog003',
          title: 'Cine',
          start: '00:30',
          stop: '02:45',
          category: 'movie',
          description: 'Thriller americano',
        },
      ],
    },
  ],

  // FRANJA 1: 03:00 - 06:00
  slot1: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog010',
          title: 'Telediario matinal',
          start: '03:00',
          stop: '06:00',
          category: 'news',
        },
      ],
    },
  ],

  // FRANJA 2: 06:00 - 09:00 (MAÑANA)
  slot2: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog020',
          title: 'Los Desayunos de TVE',
          start: '06:00',
          stop: '07:00',
          category: 'news',
          description: 'Programa informativo matinal',
          rating: '6.5',
        },
        {
          id: 'prog021',
          title: 'La Hora de la 1',
          start: '07:00',
          stop: '08:00',
          category: 'entertainment',
          description: 'Entretenimiento matutino',
        },
        {
          id: 'prog022',
          title: 'La Mañana',
          start: '08:00',
          stop: '09:00',
          category: 'entertainment',
        },
      ],
    },
    {
      channelId: 'antena3',
      programs: [
        {
          id: 'prog023',
          title: 'Espejo Público',
          start: '06:00',
          stop: '09:00',
          category: 'news',
          description: 'Actualidad y análisis',
          rating: '7.2',
        },
      ],
    },
    {
      channelId: 'telecinco',
      programs: [
        {
          id: 'prog024',
          title: 'El Programa de Ana Rosa',
          start: '06:00',
          stop: '09:00',
          category: 'entertainment',
          description: 'Magazine matinal',
        },
      ],
    },
  ],

  // FRANJA 3: 09:00 - 12:00 (MEDIA MAÑANA)
  slot3: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog030',
          title: 'La Mañana de La 1',
          start: '09:00',
          stop: '11:30',
          category: 'entertainment',
          description: 'Magazine de actualidad',
        },
        {
          id: 'prog031',
          title: 'Cocina',
          start: '11:30',
          stop: '12:00',
          category: 'lifestyle',
          description: 'Programa gastronómico',
        },
      ],
    },
    {
      channelId: 'la2',
      programs: [
        {
          id: 'prog032',
          title: 'Saber Vivir',
          start: '09:30',
          stop: '10:30',
          category: 'lifestyle',
          description: 'Salud y bienestar',
        },
        {
          id: 'prog033',
          title: 'Documental',
          start: '10:30',
          stop: '11:30',
          category: 'documentary',
        },
      ],
    },
  ],

  // FRANJA 4: 12:00 - 15:00 (MEDIODÍA)
  slot4: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog040',
          title: 'Cocina',
          start: '12:00',
          stop: '13:00',
          category: 'lifestyle',
        },
        {
          id: 'prog041',
          title: 'Informativo Territorial',
          start: '13:00',
          stop: '14:00',
          category: 'news',
        },
        {
          id: 'prog042',
          title: 'Corazón',
          start: '14:00',
          stop: '15:00',
          category: 'entertainment',
          description: 'Actualidad social',
        },
      ],
    },
    {
      channelId: 'antena3',
      programs: [
        {
          id: 'prog043',
          title: 'La Ruleta de la Suerte',
          start: '12:00',
          stop: '14:00',
          category: 'entertainment',
          description: 'Concurso',
        },
        {
          id: 'prog044',
          title: 'Antena 3 Noticias 1',
          start: '14:00',
          stop: '15:00',
          category: 'news',
        },
      ],
    },
    {
      channelId: 'telecinco',
      programs: [
        {
          id: 'prog045',
          title: 'Ya es Mediodía',
          start: '12:00',
          stop: '14:00',
          category: 'entertainment',
        },
        {
          id: 'prog046',
          title: 'Informativos Telecinco',
          start: '14:00',
          stop: '15:00',
          category: 'news',
        },
      ],
    },
  ],

  // FRANJA 5: 15:00 - 18:00 (TARDE)
  slot5: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog050',
          title: 'Telediario 1',
          start: '15:00',
          stop: '16:00',
          category: 'news',
          description: 'Informativo principal',
          rating: '8.0',
        },
        {
          id: 'prog051',
          title: 'Mercado Central',
          start: '16:00',
          stop: '17:00',
          category: 'entertainment',
        },
        {
          id: 'prog052',
          title: 'Servir y Proteger',
          start: '17:00',
          stop: '18:00',
          category: 'series',
          description: 'Serie española',
        },
      ],
    },
    {
      channelId: 'antena3',
      programs: [
        {
          id: 'prog053',
          title: 'Tu Tiempo',
          start: '15:00',
          stop: '15:30',
          category: 'news',
        },
        {
          id: 'prog054',
          title: 'Boom!',
          start: '15:30',
          stop: '17:00',
          category: 'entertainment',
          description: 'Concurso de preguntas',
        },
        {
          id: 'prog055',
          title: 'Pasapalabra',
          start: '17:00',
          stop: '18:00',
          category: 'entertainment',
          rating: '7.8',
        },
      ],
    },
    {
      channelId: 'cuatro',
      programs: [
        {
          id: 'prog056',
          title: 'Todo es mentira',
          start: '15:00',
          stop: '17:00',
          category: 'entertainment',
        },
        {
          id: 'prog057',
          title: 'Cuatro al día',
          start: '17:00',
          stop: '18:00',
          category: 'news',
        },
      ],
    },
  ],

  // FRANJA 6: 18:00 - 21:00 (TARDE-NOCHE)
  slot6: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog060',
          title: 'El Cazador',
          start: '18:00',
          stop: '19:00',
          category: 'entertainment',
        },
        {
          id: 'prog061',
          title: 'Aquí la Tierra',
          start: '19:00',
          stop: '20:00',
          category: 'documentary',
          description: 'Naturaleza y geografía',
        },
        {
          id: 'prog062',
          title: 'Telediario 2',
          start: '20:00',
          stop: '21:00',
          category: 'news',
          description: 'Informativo de la noche',
          rating: '8.5',
        },
      ],
    },
    {
      channelId: 'antena3',
      programs: [
        {
          id: 'prog063',
          title: 'El Hormiguero',
          start: '18:00',
          stop: '19:30',
          category: 'entertainment',
          description: 'Late night show',
          rating: '8.2',
        },
        {
          id: 'prog064',
          title: 'Antena 3 Noticias 2',
          start: '19:30',
          stop: '21:00',
          category: 'news',
        },
      ],
    },
    {
      channelId: 'lasexta',
      programs: [
        {
          id: 'prog065',
          title: 'Zapeando',
          start: '18:00',
          stop: '19:30',
          category: 'entertainment',
        },
        {
          id: 'prog066',
          title: 'laSexta Noticias',
          start: '19:30',
          stop: '21:00',
          category: 'news',
        },
      ],
    },
  ],

  // FRANJA 7: 21:00 - 00:00 (PRIME TIME)
  slot7: [
    {
      channelId: 'tve1',
      programs: [
        {
          id: 'prog070',
          title: 'Cine',
          start: '21:00',
          stop: '23:15',
          category: 'movie',
          description: 'Película española reciente',
          rating: '7.8',
          poster:
            'https://via.placeholder.com/300x450/ef4444/ffffff?text=Cine+TVE',
        },
        {
          id: 'prog071',
          title: 'Cine 2',
          start: '23:15',
          stop: '00:00',
          category: 'movie',
          description: 'Segunda película de la noche',
        },
      ],
    },
    {
      channelId: 'antena3',
      programs: [
        {
          id: 'prog072',
          title: 'Cine Antena 3',
          start: '21:00',
          stop: '23:30',
          category: 'movie',
          description: 'Estreno cinematográfico',
          rating: '8.1',
          poster:
            'https://via.placeholder.com/300x450/0066cc/ffffff?text=Cine+A3',
        },
        {
          id: 'prog073',
          title: 'Cine 2',
          start: '23:30',
          stop: '00:00',
          category: 'movie',
        },
      ],
    },
    {
      channelId: 'telecinco',
      programs: [
        {
          id: 'prog074',
          title: 'Supervivientes',
          start: '21:00',
          stop: '00:00',
          category: 'entertainment',
          description: 'Reality show',
          rating: '7.5',
        },
      ],
    },
    {
      channelId: 'cuatro',
      programs: [
        {
          id: 'prog075',
          title: 'First Dates',
          start: '21:00',
          stop: '22:30',
          category: 'entertainment',
          description: 'Programa de citas',
        },
        {
          id: 'prog076',
          title: 'Cine Cuatro',
          start: '22:30',
          stop: '00:00',
          category: 'movie',
        },
      ],
    },
    {
      channelId: 'lasexta',
      programs: [
        {
          id: 'prog077',
          title: 'El Intermedio',
          start: '21:00',
          stop: '22:00',
          category: 'entertainment',
          description: 'Humor y actualidad',
        },
        {
          id: 'prog078',
          title: 'Cine',
          start: '22:00',
          stop: '00:00',
          category: 'movie',
          description: 'Acción americana',
        },
      ],
    },
  ],
};

/**
 * Función helper para convertir mock data al formato esperado
 */
export function getMockDataForSlot(slotIndex: number): any[] {
  const slotKey = `slot${slotIndex}` as keyof typeof MOCK_PROGRAMS;
  const slotData = MOCK_PROGRAMS[slotKey] || [];

  // Agrupar por canal
  const channelMap = new Map();

  slotData.forEach((channelPrograms: any) => {
    const channel = MOCK_CHANNELS.find(
      (c) => c.id === channelPrograms.channelId
    );
    if (!channel) return;

    channelMap.set(channel.id, {
      id: channel.id,
      channel: {
        id: channel.id,
        name: channel.name,
        icon: channel.logo,
      },
      channels: channelPrograms.programs.map((prog: any) => ({
        id: prog.id,
        title: { value: prog.title },
        start: prog.start,
        stop: prog.stop,
        category: { value: prog.category },
        desc: prog.description || '',
        rating: prog.rating || '',
        starRating: prog.rating || '',
        poster: prog.poster || '',
      })),
    });
  });

  return Array.from(channelMap.values());
}

/**
 * Función para obtener todos los datos mock (todos los slots)
 */
export function getAllMockData(): { channels: any[] } {
  const allChannels = new Map();

  MOCK_CHANNELS.forEach((channel) => {
    allChannels.set(channel.id, {
      id: channel.id,
      name: channel.name,
      logo: channel.logo,
      timeSlotPrograms: {},
    });
  });

  // Rellenar programas por slot
  Object.keys(MOCK_PROGRAMS).forEach((slotKey, index) => {
    const slotData = MOCK_PROGRAMS[slotKey as keyof typeof MOCK_PROGRAMS];

    slotData.forEach((channelPrograms: any) => {
      const channel = allChannels.get(channelPrograms.channelId);
      if (channel) {
        channel.timeSlotPrograms[index] = channelPrograms.programs.map(
          (prog: any) => ({
            id: prog.id,
            title: prog.title,
            visibleStartTime: prog.start,
            visibleEndTime: prog.stop,
            category: { value: prog.category },
            description: prog.description || '',
            rating: prog.rating || '',
            poster: prog.poster || '',
          })
        );
      }
    });
  });

  return {
    channels: Array.from(allChannels.values()),
  };
}
