import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Chequera, ChequeraInput } from './chequera.model';
import { GetChequeraGQL } from './graphql/getChequera';
import { GetChequerasGQL } from './graphql/getChequeras';
import { GetChequerasSearchGQL } from './graphql/getChequerasSearch';
import { GetCountChequeraGQL } from './graphql/getCountChequera';
import { SaveChequeraGQL } from './graphql/saveChequera';
import { DeleteChequeraGQL } from './graphql/deleteChequera';

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
  onSaveChequera(entity: ChequeraInput): Observable<Chequera> {
    return this.genericService.onSave(this.saveChequeraGQL, { entity });
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