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
import { FilterTerminalPosFilialGQL } from './graphql/filterTerminalPosFilial';
import { SaveTerminalPosGQL } from './graphql/saveTerminalPos';
import { SearchTerminalPosGQL } from './graphql/searchTerminalPos';
import { TerminalesPosPorSerieGQL } from './graphql/terminalesPosPorSerie';
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
    private configurarTerminalPosGQL: ConfigurarTerminalPosGQL,
    private porSerieGQL: TerminalesPosPorSerieGQL,
    private filterFilialGQL: FilterTerminalPosFilialGQL
  ) { }

  /**
   * Las terminales activas con EXACTAMENTE esta serie.
   *
   * Se usa para resolver de qué aparato salió un cupón. Va contra el FILIAL, que es contra quien
   * corre el PDV. Devuelve la lista y no una sola porque quien llama tiene que poder distinguir
   * "ninguna" de "más de una": ante ambigüedad no se elige, se pregunta.
   */
  onGetPorSerie(serie: string, servidor: boolean = false): Observable<TerminalPos[]> {
    return this.genericCrud.onCustomQuery(this.porSerieGQL, { serie }, servidor, null, true);
  }

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
    // ⚠️ La query cambia según el backend, no sólo el endpoint. Los dos tipos `TerminalPos` no son
    // iguales --el ABM vive en central, así que sólo ahí existen `sucursal` como objeto y
    // `camposObligatoriosEfectivos`-- y GraphQL valida el documento ENTERO: pedirle al filial un
    // campo que no declara rechaza la consulta completa, no ese campo.
    return this.genericCrud.onCustomQuery(
      servidor ? this.filterTerminalPosGQL : this.filterFilialGQL,
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
