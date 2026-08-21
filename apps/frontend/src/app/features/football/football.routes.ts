import { Routes } from '@angular/router';

/**
 * Football bounded context routes — semantic, SEO-friendly.
 * `/deportes` redirects to `/deportes/futbol` (football-first hub).
 */
export const FOOTBALL_ROUTES: Routes = [
  {
    path: 'futbol',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/football-home/football-home.component').then(
            (m) => m.FootballHomeComponent
          ),
        title: 'Fútbol hoy: partidos, horarios y dónde verlos - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'partidos-hoy',
        loadComponent: () =>
          import('./pages/football-matches/football-matches.component').then(
            (m) => m.FootballMatchesComponent
          ),
        title: 'Partidos de fútbol hoy - Guía TV',
        data: { footballView: 'today', layout: 'public-shell' },
      },
      {
        path: 'en-directo',
        loadComponent: () =>
          import('./pages/football-matches/football-matches.component').then(
            (m) => m.FootballMatchesComponent
          ),
        title: 'Fútbol en directo hoy - Guía TV',
        data: { footballView: 'live', layout: 'public-shell' },
      },
      {
        path: 'calendario',
        loadComponent: () =>
          import('./pages/football-matches/football-matches.component').then(
            (m) => m.FootballMatchesComponent
          ),
        title: 'Calendario de fútbol - Guía TV',
        data: { footballView: 'calendar', layout: 'public-shell' },
      },
      {
        path: 'partido/:slug',
        loadComponent: () =>
          import('./pages/football-match-detail/football-match-detail.component').then(
            (m) => m.FootballMatchDetailComponent
          ),
        title: 'Partido de fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'competiciones',
        loadComponent: () =>
          import('./pages/football-competitions/football-competitions.component').then(
            (m) => m.FootballCompetitionsComponent
          ),
        title: 'Competiciones de fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'competiciones/:slug',
        loadComponent: () =>
          import('./pages/football-competition-detail/football-competition-detail.component').then(
            (m) => m.FootballCompetitionDetailComponent
          ),
        title: 'Competición de fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'equipos/:slug',
        loadComponent: () =>
          import('./pages/football-team-detail/football-team-detail.component').then(
            (m) => m.FootballTeamDetailComponent
          ),
        title: 'Equipo de fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'noticias',
        loadComponent: () =>
          import('./pages/football-news/football-news.component').then(
            (m) => m.FootballNewsComponent
          ),
        title: 'Noticias de fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'noticias/:slug',
        loadComponent: () =>
          import('./pages/football-news-detail/football-news-detail.component').then(
            (m) => m.FootballNewsDetailComponent
          ),
        title: 'Noticia de fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
      {
        path: 'buscar',
        loadComponent: () =>
          import('./pages/football-search/football-search.component').then(
            (m) => m.FootballSearchComponent
          ),
        title: 'Buscar en fútbol - Guía TV',
        data: { layout: 'public-shell' },
      },
    ],
  },
];
