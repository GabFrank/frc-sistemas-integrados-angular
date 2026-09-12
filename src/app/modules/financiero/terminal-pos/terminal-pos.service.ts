import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllTerminalPosGQL } from './graphql/allTerminalPos';
import { ConfigurarTerminalPosGQL } from './graphql/configurarTerminalPos';
import { DesasignarFormatoTerminalPosGQL } from './graphql/desasignarFormatoTerminalPos';
import { CountTerminalPosGQL } from './graphql/countTerminalPos';
import { DeleteTerminalPosGQL } from './graphql/deleteTerminalPos';
import { FilterTerminalPosGQL } from './graphql/filterTerminalPos';
import { SaveTerminalPosGQL } from './graphql/saveTerminalPos';
import { SearchTerminalPosGQL } from './graphql/searchTerminalPos';
import { TerminalPos, TerminalPosInput } from './terminal-pos.model';

@Injectable({
  providedIn: 'root'
})
export class TerminalPosService {

  constructor(
    private genericCrud: GenericCrudService,
    private getAllTerminalPos: AllTerminalPosGQL,
    private saveTerminalPosGQL: SaveTerminalPosGQL,
    private deleteTerminalPosGQL: DeleteTerminalPosGQL,
    private searchTerminalPosGQL: SearchTerminalPosGQL,
    private filterTerminalPosGQL: FilterTerminalPosGQL,
    private countTerminalPosGQL: CountTerminalPosGQL,
    private desasignarFormatoGQL: DesasignarFormatoTerminalPosGQL,
    private configurarTerminalPosGQL: ConfigurarTerminalPosGQL
  ) { }

  onCount(servidor: boolean = true): Observable<number> {
    return this.genericCrud.onCustomQuery(this.countTerminalPosGQL, null, servidor);
  }

  onGetAll(page?, size?, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onGetAll(this.getAllTerminalPos, page, size, servidor);
  }

  onSearch(texto, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onGetByTexto(this.searchTerminalPosGQL, texto, servidor);
  }

  /**
   * `sucursalId` responde el caso de uso que motivo la columna: *un gerente quiere saber cuantas
   * maquinas deberia tener en su local*. El filtro corre en la consulta, no en memoria: filtrando
   * despues, el total de la paginacion contaria las terminales de las otras sucursales.
   */
  onFilter(descripcion, codigo, serie, sucursalId, activo, page = 0, size = 10, servidor: boolean = true): Observable<PageInfo<TerminalPos>> {
    return this.genericCrud.onCustomQuery(
      this.filterTerminalPosGQL,
      { descripcion, codigo, serie, sucursalId, activo, page, size },
      servidor
    );
  }

  /**
   * Saca el formato de una terminal.
   *
   * Es el unico camino para dejarla sin formato, y eso **le bloquea la venta con tarjeta a esa
   * caja**: por eso es una accion propia y no el efecto de omitir un campo en el alta.
   */
  onDesasignarFormato(terminalPosId: number, servidor: boolean = true): Observable<boolean> {
    return this.genericCrud.onCustomMutation(this.desasignarFormatoGQL, { terminalPosId }, servidor);
  }

  /**
   * Configuracion por aparato: si se puede tipear el cupon a mano, y que campos no se pueden dejar
   * vacios.
   *
   * El backend rechaza apagar la carga manual cuando es el ultimo camino que le queda a esa caja
   * --sin formato, o con un formato cuyo driver no existe-- y devuelve el motivo en la frase.
   */
  onConfigurar(
    terminalPosId: number,
    cargaManualPermitida: boolean,
    camposObligatorios: string[],
    servidor: boolean = true
  ): Observable<TerminalPos> {
    return this.genericCrud.onCustomMutation(
      this.configurarTerminalPosGQL,
      { terminalPosId, cargaManualPermitida, camposObligatorios },
      servidor
    );
  }

  onSave(input: TerminalPosInput, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onSave(this.saveTerminalPosGQL, input, null, null, servidor);
  }

  onDelete(id, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onDelete(this.deleteTerminalPosGQL, id, '¿Eliminar terminal POS?', null, true, servidor, '¿Está seguro que desea eliminar esta terminal POS?');
  }

}
