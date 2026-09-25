import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { FormatosQrPosActivosGQL } from './graphql/formatosQrPosActivos';
import {
  DesactivarFormatoQrPosGQL,
  FormatosQrPosGQL,
  SaveFormatoQrPosGQL,
} from './graphql/formatosQrPos';
import { FormatoQrPos } from './formato-qr-pos.model';

export interface FormatoQrPosInput {
  id?: number;
  nombre: string;
  proveedorServicioId?: number;
  patron: string;
  mapeo: string;
  ejemplo: string;
  activo?: boolean;
  usuarioId?: number;
}

@Injectable({ providedIn: 'root' })
export class FormatoQrPosService {

  constructor(
    private genericService: GenericCrudService,
    private formatosQrPosActivosGQL: FormatosQrPosActivosGQL,
    private formatosQrPosGQL: FormatosQrPosGQL,
    private saveFormatoQrPosGQL: SaveFormatoQrPosGQL,
    private desactivarFormatoQrPosGQL: DesactivarFormatoQrPosGQL
  ) {}

  /**
   * ABM: siempre contra el CENTRAL (servidor=true). Los formatos se administran en un solo
   * lugar y bajan a las filiales por replicacion; editarlos desde una sucursal desincronizaria
   * la flota.
   */
  onGetTodos(): Observable<FormatoQrPos[]> {
    return this.genericService.onCustomQuery(this.formatosQrPosGQL, {}, true);
  }

  onSave(input: FormatoQrPosInput): Observable<FormatoQrPos> {
    return this.genericService.onCustomMutation(this.saveFormatoQrPosGQL, { input }, true);
  }

  onDesactivar(id: number): Observable<boolean> {
    return this.genericService.onCustomMutation(this.desactivarFormatoQrPosGQL, { id }, true);
  }

  /**
   * Formatos activos, leidos del FILIAL (servidor=false). Es lo que permite escanear el cupon
   * sin internet: las filas bajan del central por replicacion y quedan en la base local.
   */
  onGetActivos(): Observable<FormatoQrPos[]> {
    return this.genericService.onCustomQuery(
      this.formatosQrPosActivosGQL,
      {},
      false,
      null,
      true
    );
  }
}
