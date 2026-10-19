import { generateEditorialArticleSchema } from './utils';

describe('generateEditorialArticleSchema author', () => {
  const base = { title: 'T', canonicalPath: '/editorial/t' };

  it('marks the editorial team as an Organization linked to the editorial policy', () => {
    const schema = generateEditorialArticleSchema({ ...base, author: { name: 'Equipo editorial Guía TV' } }, 'https://x.test') as any;
    expect(schema.author['@type']).toBe('Organization');
    expect(schema.author.url).toBe('https://x.test/politica-editorial');
  });

  it('keeps a named person as a Person', () => {
    const schema = generateEditorialArticleSchema({ ...base, author: { name: 'Arturo Baroja' } }, 'https://x.test') as any;
    expect(schema.author['@type']).toBe('Person');
  });
});
