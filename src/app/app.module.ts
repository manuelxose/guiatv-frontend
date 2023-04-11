import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FilterComponent } from './components/filter/filter.component';
import { ProgramListComponent } from './components/program-list/program-list.component';
import { ProgramDetailsComponent } from './components/program-details/program-details.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { PrimeNgModule } from './prime-ng.module';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FilterComponent,
    ProgramListComponent,
    ProgramDetailsComponent,
    FooterComponent

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    PrimeNgModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
  ],
  exports: [
    HeaderComponent,
    FilterComponent,
    ProgramListComponent,
    ProgramDetailsComponent,
    FooterComponent
  ],

  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
