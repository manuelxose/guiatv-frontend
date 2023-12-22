import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MetaService } from 'src/app/services/meta.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  constructor(private metaSvc: MetaService, private router: Router) {}

  ngOnInit(): void {
    const canonicalUrl = this.router.url;
    console.log(canonicalUrl);

    this.metaSvc.setMetaTags({
      title: 'Guia Programacion TV',
      description: 'Guia de programacion de canales de television de España',
      canonicalUrl: canonicalUrl,
    });
  }
}
