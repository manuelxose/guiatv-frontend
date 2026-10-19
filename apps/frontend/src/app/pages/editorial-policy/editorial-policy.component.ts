import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';

@Component({
  selector: 'app-editorial-policy',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="mx-auto max-w-3xl space-y-8 px-4 py-12 text-[var(--portal-text)]">
      <a routerLink="/" class="underline">Volver al inicio</a>
      <h1 class="text-3xl font-bold">Política editorial</h1>
      <p>Guía TV ofrece información para elegir qué ver en televisión, cine y streaming.
        Estos criterios se aplican a la aprobación de nuevos contenidos y a la revisión del archivo editorial.</p>
      <p>Guía TV es un proyecto de <a class="underline" href="https://tecnoriasl.com/">TecnoRia</a>.
        El editor responsable es Max Nova. Beatriz Olmedo y Arturo Baroja también colaboran en la
        creación y revisión de textos.</p>
      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Autoría y revisión humana</h2>
        <p>Una nueva publicación requiere una persona responsable de su revisión. Una identidad de automatización
          no sustituye a un editor. La aprobación debe registrar quién revisó el contenido y cuándo.</p>
        <p>La inteligencia artificial puede ayudar a preparar borradores. Los textos asistidos deben incluir
          fuentes externas; su publicación exige comprobar los datos y aportar utilidad para el lector.</p>
      </section>
      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Fuentes y actualidad</h2>
        <p>Los precios, la disponibilidad y los horarios pueden cambiar. Las comparativas deben indicar
          la fecha de comprobación y enlazar las condiciones o fuentes utilizadas. Las imágenes deben
          contar con permiso de uso y la atribución que corresponda.</p>
      </section>
      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Publicidad y recomendaciones</h2>
        <p>Los patrocinios y enlaces de afiliación deben identificarse de forma visible. Una relación comercial
          no exime de verificar las afirmaciones ni de explicar las limitaciones de una recomendación.</p>
      </section>
      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Correcciones y revisión del archivo</h2>
        <p>El archivo está en revisión para corregir artículos breves, fuentes insuficientes y contenidos repetidos.
          Esta política no certifica que todos los artículos anteriores hayan completado esa revisión.</p>
        <p>Para comunicar un error, envía la URL y la información que permita comprobarlo a
          <a class="underline" href="mailto:soporte@tecnoriasl.com">soporte&#64;tecnoriasl.com</a>.</p>
      </section>
    </main>
  `,
})
export class EditorialPolicyComponent {
  constructor() {
    inject(MetaService).setMetaTags({
      title: 'Política editorial | Guía TV',
      description: 'Criterios de autoría, revisión humana, fuentes, publicidad y correcciones de los contenidos editoriales de Guía TV.',
      canonicalUrl: '/politica-editorial',
    });
  }
}
