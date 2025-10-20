// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: 'AIzaSyCK_jTongKez-uHqn0Inoh19DicWNPAv_o',
    authDomain: 'guia-tv-8fe3c.firebaseapp.com',
    projectId: 'guia-tv-8fe3c',
    storageBucket: 'guia-tv-8fe3c.appspot.com',
    messagingSenderId: '533857766582',
    appId: '1:533857766582:web:4dfb40ca1ac9bb39346a17',
    measurementId: 'G-P6Z3BY2DVW',
  },
  API_BLOG: 'https://us-central1-guia-tv-8fe3c.cloudfunctions.net/app/blog',
  SITE_URL: 'http://localhost:4200',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
