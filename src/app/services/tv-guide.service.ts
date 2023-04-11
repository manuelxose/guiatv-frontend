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
    return this.http.get(`https://us-central1-guia-tv-8fe3c.cloudfunctions.net/api/inicializarDatos`);
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

  getAllChannelsWithPrograms() {
    return this.firestore.collection('canales').get().pipe(
      switchMap((querySnapshot) => {
        const channelsDocs = querySnapshot.docs;

        const channelsObservables = channelsDocs.map((channelDoc) => {
          const channelId = channelDoc.id;
          const channelData: ChannelData = {
            id: channelId,
            nombre: channelDoc.get('nombre'),
            imagen: channelDoc.get('imagen'),
            programas: [],
          };

          return this.firestore.collection(`canales/${channelId}/programas`).valueChanges().pipe(
            map((programs:any) => ({
              ...channelData,
              id: channelId,
              programas: programs,
            })),
          );
        });

        return combineLatest(channelsObservables);
      }),
    );
  }
}
