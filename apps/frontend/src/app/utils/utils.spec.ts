import { serializeJsonLd } from './utils';


describe('serializeJsonLd', () => {
  it('cannot be closed by a field value, and reads back unchanged', () => {
    const schema = { '@type': 'Movie', name: 'Peli </script><img src=x onerror=alert(1)>', description: 'a < b' };
    const html = `<script type="application/ld+json">${serializeJsonLd(schema)}</script>`;
    expect(html.match(/<\/script>/g)!.length).toBe(1);
    expect(html).not.toContain('<img');
    expect(JSON.parse(serializeJsonLd(schema))).toEqual(schema);
  });
});
