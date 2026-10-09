import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { AllMaletinsGQL } from './graphql/allMaletines';
import { CountMaletinGQL } from './graphql/count-maletin';
import { DeleteMaletinGQL } from './graphql/deleteMaletin';
import { MaletinByIdGQL } from './graphql/MaletinById';
import { MaletinPorDescripcionGQL } from './graphql/maletinPorDescripcion';
import { SaveMaletinGQL } from './graphql/saveMaletin';
import { ValorMaletinGQL } from './graphql/valorMaletin';
import { IngresarMaletinCajaMayorGQL } from './graphql/ingresarMaletinCajaMayor';
import { IngresarMaletinCierreGQL } from './graphql/ingresarMaletinCierre';
import { EgresarMaletinCajaMayorGQL, EgresarMaletinCajaMayorSinClaveGQL } from './graphql/egresarMaletinCajaMayor';
import { centralNoConoceLaClave, conClaveSiElCentralLaConoce, OpcionesDePedidoConClave } from '../../../commons/core/utils/claveIdempotencia';
import { MaletinInput } from './maletin.model';

/** Un egreso de maletín listo para enviar: las variables de la mutation y la clave de ese intento. */
export interface PedidoDeEgresoMaletin {
  cajaVirtualId: number;
  maletinId: number;
  monedaId: number;
  monto: number;
  descripcion: string | null;
  claveIdempotencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaletinService {

  constructor(
    private getAllMaletines: AllMaletinsGQL,
    private getMaletinPorId: MaletinByIdGQL,
    private genericCrud: GenericCrudService,
    private saveMaletin: SaveMaletinGQL,
    private deleteMaletin: DeleteMaletinGQL,
    private getMaletinPorDescripcion: MaletinPorDescripcionGQL,
    private countMaletin: CountMaletinGQL,
    private valorMaletinGQL: ValorMaletinGQL,
    private ingresarMaletinGQL: IngresarMaletinCajaMayorGQL,
    private ingresarMaletinCierreGQL: IngresarMaletinCierreGQL,
    private egresarMaletinGQL: EgresarMaletinCajaMayorGQL,
    private egresarMaletinSinClaveGQL: EgresarMaletinCajaMayorSinClaveGQL,
  ) { }

  /** Ingresa de una vez el valor del cierre del maletín para las monedas seleccionadas. */
  onIngresarCierre(cajaVirtualId: number, maletinId: number, monedaIds: number[], descripcion?: string, servidor: boolean = true,
                   opciones?: { avisarExito?: boolean }): Observable<any> {
    return this.genericCrud.onSaveCustom(this.ingresarMaletinCierreGQL, { cajaVirtualId, maletinId, monedaIds, descripcion: descripcion || null }, servidor, opciones);
  }

  /** Valor físico estimado dentro del maletín (por moneda, del último cierre). */
  onGetValor(maletinId: number, servidor: boolean = true): Observable<any> {
    // Un solo suscriptor, con error: ya escrito (#390).
    return this.genericCrud.onCustomQuery(this.valorMaletinGQL, { maletinId }, servidor, PROPAGAR_ERROR_DE_RED, undefined,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  /** Ingresa a la caja mayor el valor de un maletín. */
  onIngresar(cajaVirtualId: number, maletinId: number, monedaId: number, monto: number, descripcion?: string, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onSaveCustom(this.ingresarMaletinGQL, { cajaVirtualId, maletinId, monedaId, monto, descripcion: descripcion || null }, servidor);
  }

  /** Egresa de la caja mayor el valor que se despacha en un maletín. */
  /**
   * Egresa el pedido tal como viene, con su clave: un reintento manda exactamente lo mismo y el central no
   * egresa dos veces. `opciones.sinClave` avisa si el central no conoce la clave.
   */
  onEgresar(pedido: PedidoDeEgresoMaletin, opciones?: { avisarExito?: boolean } & OpcionesDePedidoConClave): Observable<any> {
    const { claveIdempotencia, ...variables } = pedido;
    return conClaveSiElCentralLaConoce(conClave => conClave
      ? this.genericCrud.onSaveCustom(this.egresarMaletinGQL, pedido, true,
          { avisarExito: opciones?.avisarExito, silenciarRechazo: centralNoConoceLaClave })
      : this.genericCrud.onSaveCustom(this.egresarMaletinSinClaveGQL, variables, true,
          { avisarExito: opciones?.avisarExito }),
      opciones?.sinClave, !opciones?.esReenvio);
  }

  onCount(servidor: boolean = true): Observable<number> {
    return this.genericCrud.onCustomQuery(this.countMaletin, null, servidor);
  }

  onGetAll(page?, size?, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onGetAll(this.getAllMaletines, page, size, servidor)
  }

  onGetPorId(id, sucursalId, servidor: boolean = true, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<any>{
    return this.genericCrud.onCustomQuery(this.getMaletinPorId, {id, sucursalId}, servidor, errorConf, undefined, contexto)
  }

  onGetPorDescripcion(texto, servidor: boolean = true, errorConf?: QueryError): Observable<any>{
    return this.genericCrud.onGetByTexto(this.getMaletinPorDescripcion, texto, servidor, undefined, errorConf)
  }

  onSave(input: MaletinInput, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onSave(this.saveMaletin, input, null, null, servidor)
  }

  onDelete(id, servidor: boolean = true): Observable<any>{
    return this.genericCrud.onDelete(this.deleteMaletin, id, '¿Eliminar maletin?', null, true, servidor, "¿Está seguro que desea eliminar este maletin?");
  }

}
