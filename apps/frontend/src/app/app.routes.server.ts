import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'admin',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'mi-cuenta',
    renderMode: RenderMode.Client,
  },
  {
    path: 'comunidad',
    renderMode: RenderMode.Client,
  },
  {
    path: 'perfil/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'para-ti',
    renderMode: RenderMode.Client,
  },
  {
    path: 'embed/programacion',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
