import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService, QueryError } from '../../../generics/generic-crud.service';
import { Chequera, ChequeraInput } from './chequera.model';
import { GetChequeraGQL } from './graphql/getChequera';
import { GetChequerasGQL } from './graphql/getChequeras';
import { GetChequerasSearchGQL } from './graphql/getChequerasSearch';
import { GetCountChequeraGQL } from './graphql/getCountChequera';
import { SaveChequeraGQL } from './graphql/saveChequera';
import { DeleteChequeraGQL } from './graphql/deleteChequera';

const LECTURA_CHEQUERAS: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};

@Injectable({
  providedIn: 'root'
})
export class ChequeraService {

  constructor(
    private genericService: GenericCrudService,
    private getChequeraGQL: GetChequeraGQL,
    private getChequerasGQL: GetChequerasGQL,
    private getChequerasSearchGQL: GetChequerasSearchGQL,
    private getCountChequeraGQL: GetCountChequeraGQL,
    private saveChequeraGQL: SaveChequeraGQL,
    private deleteChequeraGQL: DeleteChequeraGQL
  ) { }

  /**
   * Obtiene una chequera por su ID
   * @param id ID de la chequera
   * @returns Observable de Chequera
   */
  onGetChequera(id: number): Observable<Chequera> {
    return this.genericService.onGetById(this.getChequeraGQL, id);
  }

  /**
   * Obtiene todas las chequeras con paginación
   * @param page Número de página
   * @param size Tamaño de página
   * @returns Observable de lista de Chequeras
   */
  onGetChequeras(page: number = 0, size: number = 10): Observable<Chequera[]> {
    return this.genericService.onGetAll(this.getChequerasGQL, page, size);
  }

  /**
   * Igual que `onGetChequeras`, pero el error de red y el del servidor llegan a quien llama (`onGetAll` no emite
   * nada ante un error: la pantalla quedaba con la lista vieja o vacía, sin aviso) (#390).
   */
  onLeerChequeras(page: number = 0, size: number = 10): Observable<Chequera[]> {
    return this.genericService.onCustomQuery(this.getChequerasGQL, { page, size }, true, LECTURA_CHEQUERAS);
  }

  /**
   * Busca chequeras por texto
   * @param texto Texto para búsqueda
   * @returns Observable de lista de Chequeras
   */
  onSearchChequeras(texto: string): Observable<Chequera[]> {
    return this.genericService.onCustomQuery(this.getChequerasSearchGQL, { texto });
  }

  /**
   * Obtiene el conteo total de chequeras
   * @returns Observable con el número total de chequeras
   */
  onCountChequeras(): Observable<number> {
    return this.genericService.onCustomQuery(this.getCountChequeraGQL, {});
  }

  /**
   * Guarda o actualiza una chequera
   * @param entity Datos de la chequera a guardar
   * @returns Observable de la Chequera guardada
   */
  onSaveChequera(entity: ChequeraInput, errorConf?: QueryError): Observable<Chequera> {
    // onSave() ya envuelve su argumento como { entity: input }; pasar { entity }
    // producía un doble-wrap ({ entity: { entity } }) que el backend rechazaba
    // con ValidationError. Se pasa el entity crudo, como el resto de los services.
    // Con `errorConf` de red propagada quien llama se entera de un guardado sin respuesta: sin eso el genérico no
    // emite nada y el diálogo quedaba guardando para siempre (#390).
    return this.genericService.onSave(this.saveChequeraGQL, entity, undefined, undefined, true, errorConf);
  }

  /**
   * Elimina una chequera por su ID
   * @param id ID de la chequera a eliminar
   * @returns Observable booleano indicando si se eliminó correctamente
   */
  onDeleteChequera(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteChequeraGQL, id, 'Chequera');
  }
} 