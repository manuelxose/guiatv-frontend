export const BLOG_MOCK_CATEGORIES = [
  {
    id: 101,
    name: 'Cine',
    slug: 'cine',
    description: 'Estrenos, criticas y analisis de peliculas.',
  },
  {
    id: 102,
    name: 'Series',
    slug: 'series',
    description: 'Recomendaciones y novedades de series para maraton.',
  },
  {
    id: 103,
    name: 'Anime',
    slug: 'anime',
    description: 'Temporadas, clasicos y guias para fans de anime.',
  },
  {
    id: 104,
    name: 'Streaming',
    slug: 'streaming',
    description: 'Comparativas y estrenos en plataformas de streaming.',
  },
  {
    id: 105,
    name: 'Guia TV',
    slug: 'guia-tv',
    description: 'Programacion destacada y planes para el prime time.',
  },
  {
    id: 106,
    name: 'Documentales',
    slug: 'documentales',
    description: 'Historias reales y series documentales recomendadas.',
  },
];

const CATEGORY_LOOKUP = new Map(
  BLOG_MOCK_CATEGORIES.map((category) => [category.id, category])
);

const RAW_POSTS = [
  {
    id: 2001,
    slug: 'guia-rapida-que-ver-esta-noche',
    title: { rendered: 'Guia rapida: que ver esta noche en abierto' },
    excerpt: {
      rendered:
        '<p>Una seleccion corta para elegir sin perder tiempo en el prime time.</p>',
    },
    content: {
      rendered: `
        <p>Si no quieres perder tiempo navegando, esta guia rapida te deja tres opciones claras para la noche.</p>
        <h2>Como leer la programacion</h2>
        <ul>
          <li>Busca primero el genero que te apetece.</li>
          <li>Comprueba la hora de inicio para evitar cortes.</li>
          <li>Alterna entre cine y series para variar el ritmo.</li>
        </ul>
        <p>Con estos pasos eliges en minutos y disfrutas del contenido completo.</p>
      `,
    },
    date: '2025-12-19T20:00:00.000Z',
    modified: '2025-12-19T20:00:00.000Z',
    categories: [105, 102],
    tags: ['prime-time', 'guia', 'television'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      caption: 'Seleccion de prime time.',
    },
  },
  {
    id: 2002,
    slug: 'top-10-series-cortas-fin-de-semana',
    title: { rendered: 'Top 10 series cortas para un fin de semana' },
    excerpt: {
      rendered:
        '<p>Miniseries y temporadas cortas que se ven rapido y enganchan desde el primer episodio.</p>',
    },
    content: {
      rendered: `
        <p>Las series cortas son perfectas para maratones sin comprometer una semana entera.</p>
        <h2>Por que funcionan</h2>
        <p>Tramas concentradas, pocos episodios y finales cerrados.</p>
        <h2>Ideas para empezar</h2>
        <ol>
          <li>Thrillers de 6 episodios.</li>
          <li>Comedias de 20 minutos.</li>
          <li>Docuseries de una temporada.</li>
        </ol>
      `,
    },
    date: '2025-12-18T18:00:00.000Z',
    modified: '2025-12-18T18:00:00.000Z',
    categories: [102],
    tags: ['series', 'top-10', 'maraton'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
      caption: 'Series cortas en streaming.',
    },
  },
  {
    id: 2003,
    slug: 'clasicos-cine-espanol-imprescindibles',
    title: { rendered: 'Clasicos del cine espanol que siguen brillando' },
    excerpt: {
      rendered:
        '<p>Una mirada a peliculas que marcaron epoca y siguen siendo referencia.</p>',
    },
    content: {
      rendered: `
        <p>El cine espanol tiene joyas que no envejecen. Aqui reunimos titulos que conservan su fuerza.</p>
        <h2>Lo que los hace eternos</h2>
        <ul>
          <li>Guiones con identidad propia.</li>
          <li>Interpretaciones memorables.</li>
          <li>Temas que siguen vigentes.</li>
        </ul>
        <p>Recuperarlos es redescubrir parte de nuestra memoria cultural.</p>
      `,
    },
    date: '2025-12-17T17:00:00.000Z',
    modified: '2025-12-17T17:00:00.000Z',
    categories: [101],
    tags: ['cine', 'clasicos', 'historia'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1600&q=80',
      caption: 'Clasicos que resisten el tiempo.',
    },
  },
  {
    id: 2004,
    slug: 'anime-temporada-estrenos-imprescindibles',
    title: { rendered: 'Anime de temporada: 5 estrenos imprescindibles' },
    excerpt: {
      rendered:
        '<p>Accion, fantasia y slice of life en una lista compacta para empezar la temporada.</p>',
    },
    content: {
      rendered: `
        <p>La temporada viene cargada y elegir bien ahorra tiempo. Aqui tienes cinco estrenos para empezar.</p>
        <h2>Que mirar primero</h2>
        <ol>
          <li>Una serie de accion con animacion potente.</li>
          <li>Una aventura fantastica para desconectar.</li>
          <li>Un drama con personajes bien escritos.</li>
        </ol>
        <p>Con esta base puedes ampliar segun tu genero favorito.</p>
      `,
    },
    date: '2025-12-16T16:00:00.000Z',
    modified: '2025-12-16T16:00:00.000Z',
    categories: [103],
    tags: ['anime', 'estrenos', 'temporada'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&q=80',
      caption: 'Estrenos para empezar la temporada.',
    },
  },
  {
    id: 2005,
    slug: 'comparativa-plataformas-streaming-catalogo',
    title: { rendered: 'Comparativa de plataformas: que ofrece cada catalogo' },
    excerpt: {
      rendered:
        '<p>Un resumen claro para saber donde ver cine, series y anime sin pagar de mas.</p>',
    },
    content: {
      rendered: `
        <p>Los catalogos cambian cada mes. Esta comparativa te ayuda a elegir segun tus gustos.</p>
        <h2>Claves de la comparativa</h2>
        <ul>
          <li>Catalogo de cine reciente.</li>
          <li>Series originales exclusivas.</li>
          <li>Precio y numero de pantallas.</li>
        </ul>
        <p>Combina una plataforma principal y una rotativa para ahorrar.</p>
      `,
    },
    date: '2025-12-15T15:00:00.000Z',
    modified: '2025-12-15T15:00:00.000Z',
    categories: [104],
    tags: ['streaming', 'comparativa', 'catalogo'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80',
      caption: 'Comparativa de catalogos.',
    },
  },
  {
    id: 2006,
    slug: 'comedias-para-desconectar',
    title: { rendered: 'Comedias para desconectar: seleccion ligera' },
    excerpt: {
      rendered:
        '<p>Historias sencillas y personajes carismaticos para terminar el dia con una sonrisa.</p>',
    },
    content: {
      rendered: `
        <p>Cuando el dia pesa, una comedia ligera es la mejor receta.</p>
        <h2>Elige segun tu humor</h2>
        <ul>
          <li>Comedia romantica para algo dulce.</li>
          <li>Humor absurdo para apagar el cerebro.</li>
          <li>Ensemble cast para risas constantes.</li>
        </ul>
        <p>Lo importante es salir de la rutina sin esfuerzo.</p>
      `,
    },
    date: '2025-12-14T14:00:00.000Z',
    modified: '2025-12-14T14:00:00.000Z',
    categories: [101, 102],
    tags: ['comedias', 'series', 'cine'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1460881680858-30d872d5b530?auto=format&fit=crop&w=1600&q=80',
      caption: 'Comedias para cerrar el dia.',
    },
  },
  {
    id: 2007,
    slug: 'documentales-que-enganchan',
    title: { rendered: 'Documentales que enganchan desde el primer minuto' },
    excerpt: {
      rendered:
        '<p>Series documentales y peliculas que te atrapan con historias reales.</p>',
    },
    content: {
      rendered: `
        <p>Los documentales ya no son lentos: ahora combinan ritmo, investigacion y narrativa visual.</p>
        <h2>Temas que funcionan</h2>
        <ul>
          <li>True crime bien documentado.</li>
          <li>Biografias con archivos exclusivos.</li>
          <li>Historias sociales con impacto.</li>
        </ul>
        <p>Si no sabes por donde empezar, elige uno de estos formatos.</p>
      `,
    },
    date: '2025-12-13T13:00:00.000Z',
    modified: '2025-12-13T13:00:00.000Z',
    categories: [106, 104],
    tags: ['documentales', 'historias-reales'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
      caption: 'Historias reales que atrapan.',
    },
  },
  {
    id: 2008,
    slug: 'sagas-para-maraton-orden-recomendado',
    title: { rendered: 'Sagas para maraton: orden recomendado' },
    excerpt: {
      rendered:
        '<p>El orden ideal para ver sagas sin perder detalles ni giros.</p>',
    },
    content: {
      rendered: `
        <p>Las sagas largas pueden intimidar. Con un orden claro es mas facil disfrutar.</p>
        <h2>Orden cronologico vs estreno</h2>
        <p>Si buscas coherencia narrativa, el cronologico gana. Si prefieres sorpresas, ve por estreno.</p>
        <h2>Consejo rapido</h2>
        <p>Divide la maraton en bloques de 2 o 3 peliculas para mantener el ritmo.</p>
      `,
    },
    date: '2025-12-12T12:00:00.000Z',
    modified: '2025-12-12T12:00:00.000Z',
    categories: [101, 104],
    tags: ['sagas', 'maraton', 'cine'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1600&q=80',
      caption: 'Sagas para maraton.',
    },
  },
  {
    id: 2009,
    slug: 'anime-clasico-para-empezar',
    title: { rendered: 'Anime clasico para empezar sin perderse' },
    excerpt: {
      rendered:
        '<p>Recomendaciones base para quien quiere entrar al anime con seguridad.</p>',
    },
    content: {
      rendered: `
        <p>El anime clasico es una puerta perfecta para nuevos fans.</p>
        <h2>Por donde empezar</h2>
        <ul>
          <li>Una aventura con mundo amplio.</li>
          <li>Un drama de personajes inolvidables.</li>
          <li>Una comedia ligera para relajar.</li>
        </ul>
        <p>Con estas bases puedes explorar generos mas especificos.</p>
      `,
    },
    date: '2025-12-11T11:00:00.000Z',
    modified: '2025-12-11T11:00:00.000Z',
    categories: [103],
    tags: ['anime', 'clasicos', 'recomendaciones'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=80',
      caption: 'Anime clasico para empezar.',
    },
  },
  {
    id: 2010,
    slug: 'agenda-estrenos-semana',
    title: { rendered: 'Agenda de estrenos de la semana' },
    excerpt: {
      rendered:
        '<p>Calendario rapido con lo nuevo en cines y plataformas durante los proximos dias.</p>',
    },
    content: {
      rendered: `
        <p>La semana llega cargada de estrenos y aqui tienes un resumen directo.</p>
        <h2>Cines</h2>
        <p>Dos grandes estrenos comerciales y una opcion independiente para paladares curiosos.</p>
        <h2>Streaming</h2>
        <p>Series nuevas, documentales y un par de peliculas esperadas.</p>
      `,
    },
    date: '2025-12-10T10:00:00.000Z',
    modified: '2025-12-10T10:00:00.000Z',
    categories: [104, 105],
    tags: ['estrenos', 'agenda', 'streaming'],
    featured_image: {
      source_url:
        'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1600&q=80',
      caption: 'Agenda semanal de estrenos.',
    },
  },
];

const mapCategories = (ids: number[]) =>
  ids
    .map((id) => {
      const category = CATEGORY_LOOKUP.get(id);
      return category ? { ...category } : null;
    })
    .filter(Boolean);

export const BLOG_MOCK_POSTS = RAW_POSTS.map((post) => ({
  ...post,
  categories_name: mapCategories(post.categories || []),
}));
