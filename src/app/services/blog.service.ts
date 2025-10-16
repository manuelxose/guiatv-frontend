import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, first, map, take } from 'rxjs';
import { HttpService } from './http.service';
import { TvGuideService } from './tv-guide.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  //SUSCRIBER PARA CATEGORIAS DEL BLOG

  private _blogCategories = new BehaviorSubject<any[]>([]);
  public blogCategories$ = this._blogCategories.asObservable();

  //SUSCRIBER PARA posts

  private _posts = new BehaviorSubject<any[]>([]);
  public posts$ = this._posts.asObservable();

  ///Url de la api

  private API_URL = environment.API_BLOG;

  constructor(
    private HttpService: HttpService,
    private TvService: TvGuideService
  ) {}

  // *******************************************     SECCION DEL CONTROL DE FLUJO DE DATOS ENTRE COMPONENTES DEL BLOG ******************************************************

  public setBlogCategories(data: any[]): void {
    this._blogCategories.next(data);
  }

  public setPosts(data: any[]): void {
    this._posts.next(data);
  }

  public getBlogCategories(): any[] {
    return this._blogCategories.getValue();
  }

  public getPosts(): any[] {
    return this._posts.getValue();
  }

  // *******************************************     SECCION PARA LA INICIALIZACION DE LAS LISTAS DE DESTACADOS EN EL BLOG ******************************************************

  // SE LLAMAN LOS POST DE LA API SI SE INICIA DESDE EL BLOG LISTA DE DESTACADOS LATERAL
  // TODO: ESTO SE DEBE DE HACER DESDE EL COMPONENTE

  public setProgramsFromApi() {
    //SE COMPRUEBA SI HAY POSTS EN EL BEHAVIOR SUBJECT
    //SI NO HAY POSTS, SE HACE LA PETICION A LA API
    this.TvService.getProgramsAndChannels().subscribe((data) => {
      // si no hay posts, se hace la petición a la API
      console.log('servico del blog', data);
      if (data.length === 0) {
        console.log('No hay peliculas destacadas');
        this.TvService.getFromApi()
          .pipe(first())
          .subscribe((data) => {
            this.HttpService.setProgramas(data, 'today').then(() => {
              this.TvService.setData(data);
            });
          });
      }
    });
  }

  // *******************************************     SECCION PARA EL CONTROL DE DE LOS POSTS DEL BLOG(PETICIONES API) ******************************************************

  // Petición a la API para obtener toddos los posts del blog

  public getAllPosts(): Observable<any[]> {
    // Primero se comprueba si hay posts en el BehaviorSubject
    // Si no hay posts, se hace la petición a la API

    if (this.getPosts().length === 0) {
      return this.HttpService.get<any[]>(this.API_URL);
    }
    // Si hay posts, se devuelven como un observable
    return this.posts$;
  }
  public getPostBySlug(slug: string): Observable<any[]> {
    return this.HttpService.get<any[]>(`${this.API_URL}?slug=${slug}`);
  }

  // Obttener todas las categorias del blog

  public getBlogCategoriesFromApi(): Observable<any[]> {
    return this.HttpService.get<any[]>(`${this.API_URL}/categories`);
  }

  //Obterner los blogs relacionados

  public getRelatedPosts(id: number): Observable<any[]> {
    return this.HttpService.get<any[]>(`${this.API_URL}?categories=${id}`);
  }

  // *******************************************     SECCION PARA EL CONTROL DE DE LOS POSTS DEL BLOG(FITLRADO DE DATOS) ******************************************************

  // Obtener todas las categorias del blog desde los post ya obtenidos

  public intiCategories(data: any): void {
    const categories: any = [];

    data.forEach((post: any) => {
      post.categories_name.forEach((category: any) => {
        if (
          categories.length === 0 ||
          categories.find((cat: any) => cat.id === category.id) === undefined
        ) {
          categories.push(category);
        }
      });
    });
    this.setBlogCategories(categories);
  }

  // Filtrar los posts por categoria

  public filterByCategory(id: number): Observable<any[]> {
    return this.posts$.pipe(
      take(1),
      first(),
      // tslint:disable-next-line: no-shadowed-variable
      map((posts) => posts.filter((post) => post.categories.includes(id)))
    );
  }
}
