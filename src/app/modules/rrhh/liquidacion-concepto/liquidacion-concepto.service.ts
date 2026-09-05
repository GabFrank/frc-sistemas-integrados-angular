import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { LiquidacionConcepto } from './liquidacion-concepto.model';
import { LiquidacionConceptosGQL } from './graphql/LiquidacionConceptos';
import { SaveLiquidacionConceptoGQL } from './graphql/SaveLiquidacionConcepto';
import { DeleteLiquidacionConceptoGQL } from './graphql/DeleteLiquidacionConcepto';

@Injectable({
  providedIn: 'root'
})
export class LiquidacionConceptoService {

  constructor(
    private genericService: GenericCrudService,
    private liquidacionConceptosGQL: LiquidacionConceptosGQL,
    private saveLiquidacionConceptoGQL: SaveLiquidacionConceptoGQL,
    private deleteLiquidacionConceptoGQL: DeleteLiquidacionConceptoGQL
  ) { }

  /**
   * El backend no expone busqueda por texto para este catalogo, solo paginado. Es un
   * catalogo chico (los codigos que el motor de liquidacion sabe resolver), asi que se
   * trae entero y la lista filtra en memoria.
   */
  onGetAll(page = 0, size = 200, servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.liquidacionConceptosGQL, page, size, servidor);
  }

  onSave(input: any, servidor = true): Observable<LiquidacionConcepto> {
    return this.genericService.onSave<LiquidacionConcepto>(this.saveLiquidacionConceptoGQL, input, null, null, servidor);
  }

  /**
   * El backend rechaza con GraphQLException si el concepto ya aparece en items emitidos
   * (liquidacion_item.codigo es un String, no una FK) y ese mensaje llega al snackbar.
   * Sin ese chequeo, CrudService.deleteById devolveria false en silencio y la UI diria
   * "eliminado con exito". Mismo patron que CargoService.onDelete.
   */
  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteLiquidacionConceptoGQL, id, null, null, false, servidor);
  }
}
