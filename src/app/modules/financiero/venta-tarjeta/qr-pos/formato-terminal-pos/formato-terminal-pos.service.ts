import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import {
  DesactivarFormatoTerminalPosGQL,
  FormatosTerminalPosActivosCentralGQL,
  FormatosTerminalPosActivosGQL,
  FormatosTerminalPosGQL,
  SaveFormatoTerminalPosGQL,
  TerminalesQueUsanFormatoGQL,
} from './graphql/formatosTerminalPos';
import { FormatoTerminalPos } from './formato-terminal-pos.model';

export interface FormatoTerminalPosInput {
  id?: number;
  nombre: string;
  proveedorServicioId?: number;
  /** MAQUINA | WEB | API. El backend lo rechaza si no es uno de esos. */
  tipo: string;
  /** Obligatorio para MAQUINA y WEB; solo API puede no tenerlo. */
  patron?: string;
  mapeo: string;
  ejemplo?: string;
  activo?: boolean;
  usuarioId?: number;
}

@Injectable({ providedIn: 'root' })
export class FormatoTerminalPosService {

  constructor(
    private genericService: GenericCrudService,
    private formatosGQL: FormatosTerminalPosGQL,
    private formatosActivosGQL: FormatosTerminalPosActivosGQL,
    private formatosActivosCentralGQL: FormatosTerminalPosActivosCentralGQL,
    private saveGQL: SaveFormatoTerminalPosGQL,
    private desactivarGQL: DesactivarFormatoTerminalPosGQL,
    private terminalesQueUsanGQL: TerminalesQueUsanFormatoGQL
  ) {}

  /**
   * ABM: siempre contra el CENTRAL (`servidor = true`). Los formatos se administran en un solo
   * lugar y bajan a las filiales por replicacion; editarlos desde una sucursal desincronizaria la
   * flota.
   */
  onGetTodos(): Observable<FormatoTerminalPos[]> {
    return this.genericService.onCustomQuery(this.formatosGQL, {}, true);
  }

  /**
   * Los elegibles para asignar a una terminal.
   *
   * Contra el FILIAL por default (`servidor = false`): es lo que lee el PDV, y tiene que funcionar
   * sin internet. El ABM pide `servidor = true`.
   *
   * **La query no es la misma de los dos lados.** El type `FormatoTerminalPos` esta declarado
   * distinto en cada backend --central da `proveedorServicio`, filial da `proveedorServicioId`--
   * y GraphQL rechaza la query entera si se le pide un campo que no declara. Elegir mal no
   * degrada: devuelve la lista vacia, y el alta de terminal exige formato.
   */
  onGetActivos(servidor = false): Observable<FormatoTerminalPos[]> {
    const gql = servidor ? this.formatosActivosCentralGQL : this.formatosActivosGQL;
    return this.genericService.onCustomQuery(gql, {}, servidor);
  }

  onSave(input: FormatoTerminalPosInput): Observable<FormatoTerminalPos> {
    return this.genericService.onCustomMutation(this.saveGQL, { input }, true);
  }

  onDesactivar(id: number): Observable<boolean> {
    return this.genericService.onCustomMutation(this.desactivarGQL, { id }, true);
  }

  /** Cuantas terminales lo usan. Se consulta antes de ofrecer desactivarlo. */
  onContarTerminalesQueLoUsan(id: number): Observable<number> {
    return this.genericService.onCustomQuery(this.terminalesQueUsanGQL, { id }, true);
  }
}
