import { markdownLeftoversToHtml } from './markdown-leftovers';

describe('markdownLeftoversToHtml', () => {
  it('turns leftover Markdown headings and bold into HTML', () => {
    expect(markdownLeftoversToHtml('<p>### Posibles ofertas</p><p>Con **Movistar Plus+** hay más.</p>')).toBe(
      '<h3>Posibles ofertas</h3><p>Con <strong>Movistar Plus+</strong> hay más.</p>'
    );
  });

  it('leaves valid HTML and unrelated asterisks alone', () => {
    const html = '<h2>Título</h2><p>Precio* sujeto a cambios</p>';
    expect(markdownLeftoversToHtml(html)).toBe(html);
  });
});
