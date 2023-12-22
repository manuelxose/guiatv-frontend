import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { HttpService } from 'src/app/services/http.service';
import { MetaService } from 'src/app/services/meta.service';
import { ModalService } from 'src/app/services/modal.service';
import { TvGuideService } from 'src/app/services/tv-guide.service';

@Component({
  selector: 'app-canal-completo',
  templateUrl: './canal-completo.component.html',
  styleUrls: ['./canal-completo.component.scss'],
})
export class CanalCompletoComponent {
  public query: string = '';
  public diaSeleccionado: string = 'today';
  public canal: string = '';
  public programs: any = [];
  public program: any = {};
  public categorias: any[] = [];
  public categoriaSeleccionada: string = 'Selcciona una categoria';

  constructor(
    private route: ActivatedRoute,
    private http: HttpService,
    private modalService: ModalService,
    private svcGuide: TvGuideService,
    private router: Router,
    private metaSvc: MetaService
  ) {}

  ngOnInit() {
    this.route.paramMap
      .subscribe((params) => {
        this.query = params.get('id')?.toString() || '';
        this.canal = this.query.replace('-', ' ');
      })
      .unsubscribe();

    const canonicalUrl = this.router.url;

    this.metaSvc.setMetaTags({
      title: 'Programamacion de ' + this.canal + ' hoy',
      description: 'Programacion de ' + this.canal + ' hoy',
      canonicalUrl: canonicalUrl,
    });

    try {
      this.http.programas$
        .pipe(first())
        .subscribe(async (data) => {
          if (data.length === 0) {
            (await this.http.getProgramacion('today')).subscribe((data) => {
              this.http.setProgramas(data, 'today').then(() => {
                this.managePrograms(data);
              });
            });
          } else {
            this.managePrograms(data);
          }
        })
        .unsubscribe();
    } catch (error) {
      console.log(error);
    }
  }

  async cambiarDia(dia: string) {
    console.log('Cambiando dia:', dia);
    this.diaSeleccionado = dia;
    (await this.http.getProgramacion(dia)).subscribe((data) => {
      this.http.setProgramas(data, dia).then(() => {
        this.managePrograms(data);
      });
    });
  }

  private managePrograms(programas: any) {
    this.svcGuide.setData(programas);
    // this.svcGuide.getProgramsByChannel(programas);
    this.programs = this.svcGuide.getProgramsByChannel(
      this.canal.replace('-', ' ')
    );
    //this.program es el programa que se optiene de cmpareDate
    this.program = this.programs.find((programa: any) => {
      console.log(
        this.compareDate(programa.start, programa.stop, programa.title.value)
      );
      this.compareDate(programa.start, programa.stop, programa.title.value);
    });
    console.log('Programas del canal:', this.program);
    this.categorias = this.svcGuide
      .getAllCategories()
      .filter((categoria) => categoria !== undefined);
    console.log('Categorias:', this.categorias);

    console.log('categorias:', this.categorias);
  }

  public manageModal(program: any) {
    console.log('Programa:', program);
    this.modalService.setPrograma(program);
  }

  public compareDate(
    dateIni: string,
    dateFin: string,
    titulo: string
  ): boolean {
    console.log('Comparando fechas' + titulo);

    // Obtiene la hora actual, la hora de inicio y la hora de fin

    const horaActual = new Date().getTime() + 3600000; // Suma 1 hora en milisegundos (3600000 ms)

    const horaInicio = new Date(dateIni).getTime();
    const horaFin = new Date(dateFin).getTime();

    // Obtén las horas y minutos de la hora actual y las horas de inicio y fin
    if (horaActual >= horaInicio && horaActual <= horaFin) {
      return true;
    }
    return false;
  }

  public getProgramsByCategory(categoria: string) {
    return this.svcGuide.getProgramsByCategory(categoria);
  }
}
