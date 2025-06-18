import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AllTiposPreciosGQL } from './graphql/allTiposPrecios';
import { saveTipoPrecioGQL } from './graphql/saveTipoPrecio';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MainService } from '../../../main.service';
import { TipoPrecioInput } from './tipo-precio-input.model';

@Injectable({
  providedIn: 'root'
})
export class TipoPrecioService {

  constructor(
    private allTipoPrecios: AllTiposPreciosGQL,
    private saveTipoPrecio: saveTipoPrecioGQL,
    private genericService: GenericCrudService,
    private mainService: MainService
  ) { }

  onGetAllTipoPrecios(servidor: boolean = true){
    return this.genericService.onCustomQuery(this.allTipoPrecios, null, servidor);
  }

  /**
   * Guarda un nuevo tipo de precio
   * @param input - Datos del tipo de precio a guardar
   * @param servidor - Si debe enviar al servidor (true) o solo local (false)
   * @returns Observable con el resultado de la operación
   */
  onSave(input: TipoPrecioInput, servidor = true): Observable<any> {
    input.usuarioId = this.mainService?.usuarioActual?.id;
    return this.genericService.onSave(this.saveTipoPrecio, input, null, null, servidor);
  }
}
