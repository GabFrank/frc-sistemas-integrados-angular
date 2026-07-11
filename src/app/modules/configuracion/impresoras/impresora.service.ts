import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DispositivoDetectado, Impresora, ImpresoraInput } from './impresora.model';
import { DispositivosParaInstalarGQL } from './graphql/dispositivosParaInstalar';
import { InstalarImpresoraCupsGQL } from './graphql/instalarImpresoraCups';
import { ImpresorasGQL } from './graphql/impresorasQuery';
import { ImpresoraByIdGQL } from './graphql/impresoraById';
import { SaveImpresoraGQL } from './graphql/saveImpresora';
import { DeleteImpresoraGQL } from './graphql/deleteImpresora';
import { ImpresorasDelSistemaGQL } from './graphql/impresorasDelSistema';
import { ImprimirPruebaGQL } from './graphql/imprimirPrueba';

@Injectable({
  providedIn: 'root'
})
export class ImpresoraService {

  constructor(
    private genericService: GenericCrudService,
    private impresorasGQL: ImpresorasGQL,
    private impresoraByIdGQL: ImpresoraByIdGQL,
    private saveImpresoraGQL: SaveImpresoraGQL,
    private deleteImpresoraGQL: DeleteImpresoraGQL,
    private impresorasDelSistemaGQL: ImpresorasDelSistemaGQL,
    private imprimirPruebaGQL: ImprimirPruebaGQL,
    private dispositivosParaInstalarGQL: DispositivosParaInstalarGQL,
    private instalarImpresoraCupsGQL: InstalarImpresoraCupsGQL,
  ) { }

  /** Registro de impresoras. Vive en el servidor central (administrativo). */
  todas(page?: number, size?: number): Observable<Impresora[]> {
    return this.genericService.onGetAll(this.impresorasGQL, page, size, true);
  }

  porId(id: number): Observable<Impresora> {
    return this.genericService.onGetById(this.impresoraByIdGQL, id);
  }

  guardar(input: ImpresoraInput, servidor = true): Observable<Impresora> {
    return this.genericService.onSave(this.saveImpresoraGQL, input, null, null, servidor);
  }

  eliminar(id: number, servidor = true): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteImpresoraGQL,
      id,
      '¿Eliminar impresora?',
      null,
      true,
      servidor,
      '¿Está seguro que desea eliminar esta impresora?'
    );
  }

  /**
   * Colas de impresion del host consultado (CUPS). servidor=true consulta el central;
   * servidor=false consulta el servidor local/filial. Sirve para descubrir impresoras
   * al dar de alta.
   */
  delSistema(servidor = false): Observable<string[]> {
    return this.genericService.onGetAll(this.impresorasDelSistemaGQL, null, null, servidor);
  }

  /**
   * Imprime un ticket de prueba en la impresora. Se envía al servidor central, que
   * rutea al host dueño (local o filial) según la sucursal de la impresora.
   */
  probar(id: number, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.imprimirPruebaGQL, { impresoraId: id }, servidor);
  }

  /**
   * Dispositivos conectados (USB/red/serial) que todavía no tienen cola CUPS creada.
   * Corre en el host del backend consultado (servidor=false → filial local, donde está
   * físicamente la impresora).
   */
  dispositivos(servidor = false): Observable<DispositivoDetectado[]> {
    return this.genericService.onGetAll(this.dispositivosParaInstalarGQL, null, null, servidor);
  }

  /** Instala una cola CUPS (raw por defecto = térmica ESC/POS) en el host del backend. */
  instalar(nombreCola: string, uri: string, raw = true, servidor = false): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.instalarImpresoraCupsGQL,
      { nombreCola, uri, raw },
      servidor
    );
  }
}
