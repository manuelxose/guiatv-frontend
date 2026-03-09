/**
 * seed-channel-descriptions.ts
 *
 * Populates the `description` field on channels that lack one.
 * Run: npx ts-node --project tsconfig.scripts.json scripts/seed-channel-descriptions.ts
 */
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/guiatv';

const DESCRIPTIONS: Record<string, string> = {
  // ── TDT (free Spanish broadcast) ──────────────────────────────────
  la_1: 'La 1 es el canal principal de Televisión Española (RTVE). Emite informativos, series de producción propia, cine, magazines y eventos en directo como debates electorales y retransmisiones deportivas de interés general.',
  la_2: 'La 2 es el segundo canal de RTVE, orientado a contenidos culturales, documentales, cine de autor, programas divulgativos y retransmisiones de artes escénicas. Referente de televisión pública de calidad.',
  antena_3: 'Antena 3 es una de las cadenas generalistas privadas más vistas de España. Destaca por sus series de ficción, magacines matinales, informativos y programas de entretenimiento familiar.',
  cuatro: 'Cuatro es un canal generalista del grupo Mediaset España. Ofrece reportajes de actualidad, programas de aventura, realities y deportes, con un perfil joven y dinámico.',
  telecinco: 'Telecinco es la cadena líder de audiencia de Mediaset España. Su programación incluye informativos, realities, series turcas, talk-shows y programas de entretenimiento en horario de máxima audiencia.',
  la_sexta: 'La Sexta es la cadena del grupo Atresmedia enfocada en información, debate político, humor y entretenimiento. Emite programas emblemáticos de investigación y actualidad social.',
  neox: 'Neox es el canal de Atresmedia dirigido al público joven. Emite series de animación, comedias internacionales, cine de acción y contenidos de humor.',
  nova: 'Nova es el canal temático de Atresmedia orientado a un público mayoritariamente femenino. Emite telenovelas, series turcas, programas de cocina y cine romántico.',
  energy: 'Energy es el canal de Mediaset España dedicado a un público masculino. Programación de deportes extremos, motor, supervivencia, series de acción y documentales.',
  divinity: 'Divinity es el canal de Mediaset España con contenidos de estilo de vida, moda, realities internacionales y series románticas, dirigido a una audiencia joven.',
  be_mad: 'Be Mad es el canal temático de Mediaset España con contenidos de tendencia, documentales de ciencia, tecnología, reportajes y programas de viajes.',
  mega: 'Mega es el canal de Atresmedia dedicado a series clásicas, cine de acción y aventura, documentales y contenidos nostálgicos de entretenimiento.',
  clan: 'Clan es el canal infantil de RTVE. Emite series de animación, dibujos animados y contenidos educativos para los más pequeños durante todo el día.',
  boing: 'Boing es el canal infantil de Mediaset España. Programación de dibujos animados, series de animación y contenidos para público infantil y preadolescente.',
  '24_horas': '24 Horas es el canal de noticias en continuo de RTVE. Emite informativos, conexiones en directo, análisis político y cobertura de última hora las 24 horas.',
  teledeporte: 'Teledeporte es el canal deportivo de RTVE. Retransmite competiciones nacionales e internacionales de atletismo, baloncesto, ciclismo, natación y deportes minoritarios.',
  atreseries: 'Atreseries es el canal de Atresmedia dedicado a ficción nacional e internacional. Emite series exclusivas, reposiciones de grandes éxitos y estrenos de ficción.',
  atrescine: 'Atrescine es el canal de cine de Atresmedia. Programación de películas españolas, europeas y americanas, con ciclos temáticos y estrenos recientes.',
  depelicula: 'DePelícula es un canal de TDT dedicado exclusivamente al cine. Emite largometrajes de todos los géneros: acción, comedia, drama, thriller y ciencia ficción.',
  trece: 'TRECE es el canal de la Conferencia Episcopal Española. Ofrece series, cine, documentales, informativos y programas de debate con perspectiva humanística y social.',
  dmax: 'DMAX es un canal TDT con documentales, realities de aventura, motor, ciencia y tecnología. Contenidos dirigidos a un público adulto curioso e inquieto.',
  dkiss: 'DKISS es un canal de TDT con contenidos de entretenimiento, series internacionales, documentales y true crime, con perfil de audiencia joven y diversa.',
  gol: 'GOL es el canal de TDT especializado en información deportiva: análisis de fútbol, resúmenes de Liga, Champions League, tertulias y programas de debate deportivo.',
  ten: 'Ten es un canal generalista de TDT que emite series internacionales, cine, realities y programas de entretenimiento variado.',
  real_madrid_tv: 'Real Madrid TV es el canal oficial del Real Madrid C.F. Emite partidos del equipo, ruedas de prensa, entrevistas, documentales históricos y contenido del club.',

  // ── Movistar+ (pay TV) ───────────────────────────────────────────
  m_estrenos: 'M+ Estrenos es el canal de estrenos cinematográficos de Movistar Plus+. Ofrece las películas más recientes, grandes blockbusters y cine de estreno antes que ningún otro canal.',
  m_hits: 'M+ Hits es el canal de Movistar Plus+ dedicado a las mejores películas del cine reciente, éxitos internacionales y títulos de gran acogida en taquilla.',
  m_originales: 'M+ Originales es el canal de producciones propias de Movistar Plus+. Series originales, documentales exclusivos y contenidos de creación propia premiados internacionalmente.',
  m_documentales: 'M+ Documentales es el canal de no ficción de Movistar Plus+. Documentales de naturaleza, historia, ciencia, sociedad y cine documental de autor.',
  m_accion: 'M+ Acción está especializado en cine de acción, thriller, ciencia ficción y aventura. Grandes producciones de Hollywood y clásicos del género.',
  m_comedia: 'M+ Comedia es el canal de Movistar Plus+ dedicado a comedias cinematográficas. Humor español e internacional, comedias románticas y clásicos de la risa.',
  m_drama: 'M+ Drama ofrece cine dramático, de autor y películas premiadas en los principales festivales internacionales. Historias de calidad para un público exigente.',
  m_cine_espanol: 'M+ Cine Español es el canal de Movistar Plus+ dedicado al mejor cine hecho en España. Clásicos, estrenos y producciones españolas de todas las épocas.',
  m_clasicos: 'M+ Clásicos emite cine clásico de Hollywood y europeo. Películas atemporales, grandes directores y los títulos que definieron la historia del cine.',

  // ── Cable / OTT (major international channels) ───────────────────
  axn: 'AXN es un canal de series y cine de acción. Emite las series policíacas y de suspense más populares del panorama internacional junto con cine de género.',
  star_channel: 'STAR Channel emite películas de estreno de los estudios Disney, 20th Century Studios y más. Cine de gran presupuesto, franquicias y taquillazos.',
  warner_tv: 'Warner TV ofrece series y cine del catálogo de Warner Bros. Discovery. Contenidos de ficción de alto nivel, dramas, thrillers y comedias internacionales.',
  comedy_central: 'Comedy Central es el canal referente del humor en televisión. Emite sitcoms, stand-up comedy, programas satíricos y los mejores contenidos de comedia.',
  syfy: 'SyFy es el canal de ciencia ficción y fantasía. Series y películas del género fantástico, terror, superhéroes y grandes sagas de ciencia ficción.',
  calle_13: 'Calle 13 es un canal de series y cine de acción y suspense. Emite thrillers, dramas policíacos y grandes series de cadenas americanas.',
  cosmo: 'Cosmo es un canal de entretenimiento con series dramáticas, comedias de calidad, true crime y contenidos de estilo de vida y cultura.',
  national_geographic: 'National Geographic es el canal de referencia en documentales. Naturaleza, ciencia, historia, exploración y aventuras con producción cinematográfica.',
  nat_geo_wild: 'Nat Geo Wild está dedicado al mundo animal y la vida salvaje. Documentales de fauna, expediciones y naturaleza en estado puro.',
  discovery: 'Discovery Channel ofrece documentales de ciencia, ingeniería, tecnología, naturaleza y aventura. Programas de construcción, supervivencia y exploración.',
  nickelodeon: 'Nickelodeon es un canal infantil y juvenil internacional. Series de animación, comedias en vivo, películas para niños y preadolescentes.',
  disney_junior: 'Disney Junior es el canal de Disney para los más pequeños. Series de animación educativas, personajes Disney clásicos y contenidos preescolares.',
  mtv_espana: 'MTV España es el canal de música, cultura pop y entretenimiento juvenil. Realities, series, documentales musicales y contenidos de tendencia.',
  factoria_de_ficcion: 'Factoría de Ficción (FDF) es el canal de Mediaset España especializado en series de ficción nacional e internacional. Reposiciones y maratones de las series más populares.',
  tcm: 'TCM (Turner Classic Movies) está dedicado al cine clásico de Hollywood. Películas restauradas, ciclos retrospectivos y joyas del séptimo arte.',
  bbc_series: 'BBC Series emite lo mejor de la ficción británica de la BBC. Dramas, miniseries, thrillers y comedias del prestigioso catálogo de producción británica.',
  bbc_earth: 'BBC Earth ofrece documentales de naturaleza producidos por la BBC. Expediciones, vida salvaje y las mejores series documentales del planeta.',

  // ── Autonomicos (regional Spanish channels) ───────────────────────
  canal_sur_andalucia: 'Canal Sur es la televisión pública de Andalucía. Informativos regionales, series, flamenco, ferias, Semana Santa y programas de producción propia andaluza.',
  tv3: 'TV3 es la televisión pública de Cataluña gestionada por la CCMA. Emite informativos, series, cine, deportes y programas en catalán.',
  etb_1: 'ETB 1 es el primer canal de la televisión pública vasca (EiTB). Programación en euskera con informativos, series, cine y contenidos culturales vascos.',
  etb_2: 'ETB 2 es el canal en castellano de EiTB. Informativos, series, cine, deportes y programas de entretenimiento de producción propia vasca.',
  tvg: 'TVG es la televisión pública de Galicia. Emite en gallego con informativos, series de ficción, documentales y retransmisiones culturales y deportivas gallegas.',
  telemadrid: 'Telemadrid es la televisión pública de la Comunidad de Madrid. Informativos, debates, reportajes de actualidad madrileña, deportes y programas de entretenimiento.',
  aragon_tv: 'Aragón TV es la televisión pública de Aragón. Informativos regionales, programas de cultura aragonesa, deportes y retransmisiones de fiestas y tradiciones.',
  canal_extremadura_sat: 'Canal Extremadura es la televisión pública de Extremadura. Informativos, cultura, deportes regionales y programación de proximidad extremeña.',
  a_punt: 'À Punt es la televisión pública valenciana. Emite en valenciano y castellano con informativos, series, cultura, deporte y programas de la Comunitat Valenciana.',
  ib3: 'IB3 es la televisión pública de las Islas Baleares. Informativos, series, cultura balear, deportes y programación en catalán balear.',
  tpa_asturias: 'TPA es la televisión pública del Principado de Asturias. Informativos, cultura asturiana, deportes regionales y programación de proximidad.',
  navarra_tv: 'Navarra TV es la televisión pública de la Comunidad Foral de Navarra. Informativos, cultura navarra, deportes y programas de producción regional.',
  castilla_la_mancha_media: 'Castilla-La Mancha Media es la televisión pública de Castilla-La Mancha. Informativos regionales, cultura, tradiciones y programación de proximidad manchega.',
  canal_7_region_de_murcia: 'Canal 7 Región de Murcia es la televisión autonómica murciana. Informativos locales, reportajes, deportes y cultura de la Región de Murcia.',
  rtvc: 'RTVC es la televisión pública de Canarias. Informativos, deportes canarios, carnavales, cultura insular y programación de proximidad de las islas.',
};

async function main(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db!;
  const col = db.collection('channels');

  let updated = 0;
  let skipped = 0;

  for (const [id, description] of Object.entries(DESCRIPTIONS)) {
    const result = await col.updateOne(
      { id, $or: [{ description: { $exists: false } }, { description: null }, { description: '' }] },
      { $set: { description } },
    );
    if (result.modifiedCount > 0) {
      updated++;
      console.log(`  ✅ ${id}`);
    } else {
      skipped++;
      console.log(`  ⏭️  ${id} (already has description or not found)`);
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
