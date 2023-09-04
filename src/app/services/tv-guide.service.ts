import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
interface ChannelData {
  id: string;
  nombre: string;
  imagen: string;
  programas: any[]; // Puedes reemplazar 'any[]' con una interfaz más específica si lo deseas.
}

@Injectable({
  providedIn: 'root'
})



export class TvGuideService {


  private tdtChannels = [
    'La 1',
    'La 2',
    'Antena 3',
    'Cuatro',
    'Telecinco',
    'laSexta',
    // Agrega más canales TDT aquí
  ];

  private movistarChannels = [
    'Movistar LaLiga',
    'Movistar Estrenos',
    'Movistar Series',
    // Agrega más canales Movistar aquí
  ];

  private dbPath: string;
  private collRef!: AngularFirestoreCollection<any>;
  private queryPag:any;
  private queryFilter: any;

  constructor(
    private http: HttpClient,
    private firestore: AngularFirestore,
    private db: AngularFirestore,

    ) {

        this.dbPath = "";

     }


  initProgramacion() {
    return this.http.get(`http://127.0.0.1:5001/guia-tv-8fe3c/us-central1/api/actualizarProgramacion1`)
    // return this.http.get(`https://us-central1-guia-tv-8fe3c.cloudfunctions.net/api/actualizarProgramacion`);
  }
  getCollectionData(): Observable<any> {
    return this.firestore.collection('canales').doc('myDocument').collection('mySubcollection').valueChanges();
  }
  private setPath(name:string){
    return this.dbPath = name;
  }

  public setCollection(name:string){
    this.collRef = this.db.collection(this.setPath(name))
    return this;
  }

  // OBTENEMOS TODOS LOS DOCUMENTOS DE UNA COLECCION

  public getAll(){
    return this.collRef.get();
  }

  public getdB(){

    return this.db;
  }

  public getSubcollection(name:string){
    return this.collRef.doc(name).collection('programas').get();
  }

public deleteCollection(name:string){
 //eleminar todos los documentos de una coleccion
  return this.db.collection(name).get().subscribe((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      doc.ref.delete();
    });
  });
}

public setSubcollection(name:string){
  return this.collRef.doc(name).collection('programas');
}
public getDocumentReference(path: string) {
  return this.db.doc(path).ref;
}

getDocumentByName(collection: string, name: string): Observable<any> {
  return this.firestore.collection(collection, ref => ref.where('name', '==', name)).valueChanges().pipe(
    map(docs => {
      if (docs.length > 0) {
        return docs[0]; // Devuelve el primer documento encontrado con el nombre especificado
      } else {
        return null; // Si no se encuentra ningún documento, devuelve null
      }
    })
  );
}


}
