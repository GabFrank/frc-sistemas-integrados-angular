import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';
import { PdvCaja } from '../../pdv/caja/caja.model';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { ConfiguracionService } from '../../../../shared/services/configuracion.service';
import { ImpresionPosService } from '../../../../shared/services/impresion-pos/impresion-pos.service';
import { SaveGastoClienteGQL } from '../graphql/saveGastoCliente';
import { PageInfo } from '../../../../app.component';
import { Gasto } from '../models/gastos.model';
import { PreGasto } from '../models/pre-gasto.model';
import { LineaRetiroSugerida } from '../models/linea-retiro-sugerida.model';
import { MontosRetiroPayload } from '../models/montos-retiro-payload.model';
import { RetiroPreGastoLineaInput } from '../models/retiro-pre-gasto-linea-input.model';
import { FilterGastosGQL } from '../graphql/filterGastos';
import { GastoPorCajaIdGQL } from '../graphql/gastoPorCajaId';
import { ReimprimirGastoGQL } from '../graphql/reimprimirGasto';
import { SaveGastoGQL } from '../graphql/saveGasto';
import { SaveVueltoGastoGQL } from '../graphql/saveVuelto';
import { AutorizarPreGastoGQL } from '../graphql/autorizarPreGasto';
import { RechazarPreGastoGQL } from '../graphql/rechazarPreGasto';
import { SavePreGastoGQL } from '../graphql/savePreGasto';
import { CompletarPreGastoGQL } from '../graphql/completarPreGasto';
import { ImprimirPreGastoGQL } from '../graphql/imprimirPreGasto';
import { EnviarPreGastoATesoreriaGQL } from '../graphql/enviarPreGastoATesoreria';
import { ImprimirSolicitudPagoGQL } from '../graphql/imprimirSolicitudPago';
import { AllTipoGastosGQL } from '../graphql/AllTipoGastos';
import { DeleteTipoGastoGQL } from '../graphql/deleleTipoGasto';
import { FilterPreGastosGQL } from '../graphql/filterPreGastos';
import { SaveTipoGastoGQL } from '../graphql/saveTipoGasto';
import { FilterTipoGastosGQL } from '../graphql/filterTipoGastos';
import { TipoGastoSearchGQL } from '../graphql/tipoGastosSearch';
import { TipoGasto } from '../models/tipo-gasto.model';
import { PreGastosParaRetiroGQL } from '../graphql/preGastosParaRetiro';
import { QrRetiroPreGastoGQL } from '../graphql/qrRetiroPreGasto';
import { PreGastoPorIdGQL } from '../graphql/preGastoPorId';
import { EjecutarRetiroPreGastoGQL } from '../graphql/ejecutarRetiroPreGasto';
import { LineasRetiroSugeridasGQL } from '../graphql/lineasRetiroSugeridas';
import { MontosRetiroDesdeLineasGQL } from '../graphql/montosRetiroDesdeLineas';
import { PreGastoRetiroConfirmadoGQL } from '../graphql/preGastoRetiroConfirmado';
import { RegistrarDevolucionSaldoGQL } from '../graphql/registrarDevolucionSaldo';
import { SaveGastoRendicionGQL } from '../graphql/saveGastoRendicion';
import { CancelarGastoGQL } from '../graphql/cancelarGasto';

/**
 * Retiro de pre-gasto: lo espera el cajero en el POS y va al central. Sin esto, con el central sin
 * responder no emiten nada y el diálogo queda con su spinner; los `error:` ya están escritos (#390).
 */
const RETIRO_PRE_GASTO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

@Injectable({
  providedIn: 'root'
})
export class GastoService {

  constructor(
    private genericService: GenericCrudService,
    private configService: ConfiguracionService,
    private saveGasto: SaveGastoGQL,
    private gastoPorCajaId: GastoPorCajaIdGQL,
    private reimprimirGasto: ReimprimirGastoGQL,
    private saveVuelto: SaveVueltoGastoGQL,
    private filterGasto: FilterGastosGQL,
    private onSavePreGasto: SavePreGastoGQL,
    private autorizarGQL: AutorizarPreGastoGQL,
    private rechazarGQL: RechazarPreGastoGQL,
    private completarPreGastoGQL: CompletarPreGastoGQL,
    private filterPreGastosGQL: FilterPreGastosGQL,
    private imprimirPreGastoGQL: ImprimirPreGastoGQL,
    private getAllTipoGastos: AllTipoGastosGQL,
    private onSaveTipoGasto: SaveTipoGastoGQL,
    private deleteTipoGasto: DeleteTipoGastoGQL,
    private tipoGastoSearch: TipoGastoSearchGQL,
    private filterTipoGastosGQL: FilterTipoGastosGQL,
    private enviarATesoreriaGQL: EnviarPreGastoATesoreriaGQL,
    private imprimirSolicitudPagoGQL: ImprimirSolicitudPagoGQL,
    private preGastosParaRetiroGQL: PreGastosParaRetiroGQL,
    private qrRetiroPreGastoGQL: QrRetiroPreGastoGQL,
    private preGastoPorIdGQL: PreGastoPorIdGQL,
    private ejecutarRetiroPreGastoGQL: EjecutarRetiroPreGastoGQL,
    private lineasRetiroSugeridasGQL: LineasRetiroSugeridasGQL,
    private montosRetiroDesdeLineasGQL: MontosRetiroDesdeLineasGQL,
    private preGastoRetiroConfirmadoGQL: PreGastoRetiroConfirmadoGQL,
    private registrarDevolucionSaldoGQL: RegistrarDevolucionSaldoGQL,
    private saveGastoRendicionGQL: SaveGastoRendicionGQL,
    private cancelarGastoGQL: CancelarGastoGQL,
    private saveGastoCliente: SaveGastoClienteGQL,
    private impresionPos: ImpresionPosService
  ) { }

  onSave(gasto: Gasto, servidor = true): Observable<Gasto> {
    let gastoAux = gasto;
    if (!(gasto instanceof Gasto)) {
      gastoAux = new Gasto();
      Object.assign(gastoAux, gasto);
    }
    if (this.impresionPos.porCliente(servidor)) {
      // "Imprimir desde esta PC": la filial guarda sin imprimir y el ticket se pide e imprime acá.
      // Misma condición que usa saveGasto para imprimir: solo si el gasto no llega finalizado.
      const input = gastoAux.toInput();
      return this.genericService.onSave<Gasto>(this.saveGastoCliente, input, undefined, this.configService?.getConfig()?.local, servidor).pipe(
        tap((res) => {
          if (res?.id != null && input.finalizado !== true) {
            this.impresionPos.imprimirTicket('GASTO', res.id, 'El ticket del gasto', false).subscribe();
          }
        })
      );
    }
    return this.genericService.onSave(this.saveGasto, gastoAux.toInput(), this.configService?.getConfig()?.printers?.ticket, this.configService?.getConfig()?.local, servidor);
  }

  onGetByCajaId(id: number, servidor = true): Observable<Gasto[]> {
    return this.genericService.onGetById<Gasto[]>(this.gastoPorCajaId, id, null, null, servidor);
  }

  onReimprimir(id: number, servidor = true): Observable<boolean> {
    if (this.impresionPos.porCliente(servidor)) {
      return this.impresionPos
        .imprimirTicket('GASTO', id, 'La reimpresión del gasto', true)
        .pipe(map((ok) => (ok ? true : null)));
    }
    return this.genericService
      .onCustomQuery(this.reimprimirGasto, { id: id, printerName: this.configService?.getConfig()?.printers?.ticket }, servidor,
        PROPAGAR_ERROR_DE_RED, null, this.impresionPos.contextoImpresionServidor)
      .pipe(this.impresionPos.avisarSinRespuesta('la reimpresión del gasto'));
  }

  onSaveVuelto(data: any, servidor = true): Observable<Gasto> {
    return this.genericService.onSaveCustom(this.saveVuelto, data, servidor);
  }

  onFilterGasto(id?: number, cajaId?: number, sucId?: number, responsableId?: number, descripcion?: string, page?: number, size?: number, servidor = true): Observable<PageInfo<Gasto>> {
    return this.genericService.onCustomQuery(
      this.filterGasto, {
      id,
      cajaId,
      sucId,
      responsableId,
      descripcion,
      page,
      size
    }, servidor)
  }

  /** Va al central. `errorConf` y `contexto` son para el cierre de caja (#390); sin ellos queda como antes. */
  preGastoFilter(id?: number, cajaId?: number, estado?: string, inicio?: string, fin?: string, page?: number, size?: number, estados?: string[], silentLoad?: boolean,
                 errorConf?: QueryError, contexto?: ContextoConsulta): Observable<PageInfo<PreGasto>> {
    return this.genericService.onCustomQuery(this.filterPreGastosGQL, {
      id,
      cajaId,
      estado,
      estados,
      inicio,
      fin,
      page,
      size
    }, true, errorConf ?? null, silentLoad, contexto);
  }

  preGastoGuardar(input: unknown): Observable<PreGasto> {
    return this.genericService.onSave(this.onSavePreGasto, input);
  }

  preGastoAutorizar(id: number, autorizadorId: number, usuarioId?: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.autorizarGQL, { id, autorizadorId, usuarioId, sucId });
  }

  preGastoRechazar(id: number, motivo: string, rechazadorId?: number, usuarioId?: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.rechazarGQL, { id, motivo, rechazadorId, usuarioId, sucId });
  }

  preGastoCompletar(
    id: number,
    sucId?: number,
    rindioGasto?: boolean,
    montoGastado?: number,
    montoGastadoGs?: number,
    montoGastadoRs?: number,
    montoGastadoDs?: number
  ): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.completarPreGastoGQL, {
      id,
      sucId,
      rindioGasto,
      montoGastado,
      montoGastadoGs,
      montoGastadoRs,
      montoGastadoDs
    });
  }

  preGastoImprimir(id: number, sucId?: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<string> {
    return this.genericService.onCustomQuery(this.imprimirPreGastoGQL, { id, sucId }, true, errorConf ?? null, undefined,
      contexto);
  }

  preGastoEnviarATesoreria(id: number, sucId: number, usuarioId: number): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.enviarATesoreriaGQL, { id, sucId, usuarioId });
  }

  imprimirSolicitudPago(id: number): Observable<string> {
    return this.genericService.onCustomMutation(this.imprimirSolicitudPagoGQL, { id });
  }

  tipoGastoOnGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllTipoGastos, null, null, servidor);
  }

  tipoGastoOnSave(input: any, servidor = true): Observable<any> {
    return this.genericService.onSave(this.onSaveTipoGasto, input, null, null, servidor);
  }

  tipoGastoOnDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteTipoGasto, id, "¿Eliminar tipo de gasto?", null, true, servidor, "¿Está seguro que desea eliminar este tipo de gasto?");
  }

  tipoGastoOnSearch(texto: string, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.tipoGastoSearch, texto, servidor);
  }

  tipoGastoFilter(
    naturaleza?: string,
    texto?: string,
    page?: number,
    size?: number,
    moduloPadre?: string | null,
    errorConf?: QueryError,
    contexto?: ContextoConsulta
  ): Observable<PageInfo<TipoGasto>> {
    return this.genericService.onCustomQuery(this.filterTipoGastosGQL, {
      naturaleza,
      texto,
      page,
      size,
      moduloPadre: moduloPadre ?? null,
    }, true, errorConf ?? null, undefined, contexto);
  }

  preGastosParaRetiro(sucursalCajaId: number): Observable<PreGasto[]> {
    return this.genericService.onCustomQuery(this.preGastosParaRetiroGQL, { sucursalCajaId }, true, PROPAGAR_ERROR_DE_RED,
      undefined, RETIRO_PRE_GASTO);
  }

  qrRetiroPreGasto(preGastoId: number, sucursalId: number): Observable<{ codigoQr: string; preGastoId: number; sucursalId: number; qrToken: string }> {
    return this.genericService.onCustomQuery(this.qrRetiroPreGastoGQL, { preGastoId, sucursalId }, true, PROPAGAR_ERROR_DE_RED,
      undefined, RETIRO_PRE_GASTO);
  }

  preGastoPorId(id: number, sucId?: number): Observable<PreGasto> {
    return this.genericService.onCustomQuery(this.preGastoPorIdGQL, { id, sucId });
  }

  lineasRetiroSugeridas(preGastoId: number, sucursalId: number): Observable<LineaRetiroSugerida[]> {
    return this.genericService.onCustomQuery(this.lineasRetiroSugeridasGQL, { preGastoId, sucursalId }, true,
      PROPAGAR_ERROR_DE_RED, undefined, RETIRO_PRE_GASTO);
  }

  montosRetiroDesdeLineas(lineas: RetiroPreGastoLineaInput[]): Observable<MontosRetiroPayload> {
    return this.genericService.onCustomQuery(this.montosRetiroDesdeLineasGQL, { lineas }, true, PROPAGAR_ERROR_DE_RED,
      undefined, RETIRO_PRE_GASTO);
  }

  preGastoRetiroConfirmado(preGastoId: number, sucursalId: number): Observable<boolean> {
    return this.genericService.onCustomQuery(this.preGastoRetiroConfirmadoGQL, { preGastoId, sucursalId });
  }

  ejecutarRetiroPreGasto(input: {
    preGastoId: number;
    sucursalId: number;
    sucursalCajaId: number;
    cajaId: number;
    usuarioId?: number;
    gastoRegistroId: number;
    lineas?: RetiroPreGastoLineaInput[];
  }): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.ejecutarRetiroPreGastoGQL, { input });
  }

  registrarRetiroPreGastoHibrido(
    preGasto: PreGasto,
    caja: PdvCaja,
    responsable: Funcionario,
    autorizadoPor: Funcionario | null,
    lineas: RetiroPreGastoLineaInput[],
    usuarioId?: number
  ): Observable<PreGasto> {
    const sucursalCajaId = caja?.sucursal?.id ?? caja?.sucursalId;
    return this.montosRetiroDesdeLineas(lineas).pipe(
      switchMap((montos) => {
        // Sin montos (error del servidor) el gasto se guardaba en la caja con retiro 0 y después se
        // ejecutaba el retiro en el central con las líneas reales: caja descuadrada. Se corta antes (#390).
        if (montos == null) {
          return throwError(() => new Error('No se pudieron calcular los montos del retiro: no se registró nada.'));
        }
        const gasto = new Gasto();
        gasto.caja = caja;
        gasto.sucursalId = sucursalCajaId;
        gasto.responsable = responsable;
        gasto.tipoGasto = preGasto.tipoGasto;
        gasto.autorizadoPor = autorizadoPor ?? undefined;
        gasto.observacion = preGasto.descripcion;
        gasto.retiroGs = Number(montos?.retiroGs ?? 0);
        gasto.retiroRs = Number(montos?.retiroRs ?? 0);
        gasto.retiroDs = Number(montos?.retiroDs ?? 0);
        gasto.vueltoGs = 0;
        gasto.vueltoRs = 0;
        gasto.vueltoDs = 0;
        gasto.activo = true;
        gasto.finalizado = false;

        return this.onSave(gasto, false).pipe(
          switchMap((gastoGuardado) => {
            if (!gastoGuardado?.id) {
              return throwError(() => new Error('No se pudo registrar el gasto en la caja local.'));
            }
            return this.ejecutarRetiroPreGasto({
              preGastoId: preGasto.id,
              sucursalId: preGasto.sucursalId,
              sucursalCajaId,
              cajaId: caja.id,
              usuarioId,
              gastoRegistroId: gastoGuardado.id,
              lineas,
            });
          })
        );
      })
    );
  }

  registrarDevolucionSaldo(input: {
    preGastoId: number;
    sucursalId: number;
    cajaId: number;
    vueltoGs?: number;
    vueltoRs?: number;
    vueltoDs?: number;
    usuarioId?: number;
  }): Observable<PreGasto> {
    return this.genericService.onCustomMutation(this.registrarDevolucionSaldoGQL, { input });
  }

  registrarDevolucionSaldoHibrido(
    preGasto: PreGasto,
    vueltoGs: number,
    vueltoRs: number,
    vueltoDs: number,
    sucursalCajaId: number,
    usuarioId?: number
  ): Observable<PreGasto> {
    if (!preGasto?.gastoCajaRegistroId || !preGasto?.cajaId) {
      return throwError(() => new Error('La solicitud no tiene un gasto de caja local asociado.'));
    }
    return this.onFilterGasto(
      preGasto.gastoCajaRegistroId,
      preGasto.cajaId,
      sucursalCajaId,
      undefined,
      undefined,
      0,
      1,
      false
    ).pipe(
      switchMap((page) => {
        const gastoLocal = page?.getContent?.[0];
        if (!gastoLocal?.id) {
          return throwError(() => new Error('No se encontró el gasto en la caja local.'));
        }
        const gasto = new Gasto();
        Object.assign(gasto, gastoLocal);
        gasto.sucursalId = gasto.sucursalId ?? gastoLocal.sucursal?.id ?? sucursalCajaId;
        gasto.preGastoId = preGasto.id;
        gasto.preGastoSucursalId = preGasto.sucursalId;
        gasto.vueltoGs = Number(gasto.vueltoGs ?? 0) + vueltoGs;
        gasto.vueltoRs = Number(gasto.vueltoRs ?? 0) + vueltoRs;
        gasto.vueltoDs = Number(gasto.vueltoDs ?? 0) + vueltoDs;
        return this.onSave(gasto, false).pipe(
          switchMap(() => this.registrarDevolucionSaldo({
            preGastoId: preGasto.id,
            sucursalId: preGasto.sucursalId,
            cajaId: preGasto.cajaId,
            vueltoGs,
            vueltoRs,
            vueltoDs,
            usuarioId,
          }))
        );
      })
    );
  }

  calcularMontosRetiro(preGasto: PreGasto): { gs: number; rs: number; ds: number } {
    let gs = 0;
    let rs = 0;
    let ds = 0;
    const finanzas = preGasto?.finanzas ?? [];
    if (finanzas.length > 0) {
      for (const fin of finanzas) {
        const monto = Number(fin?.monto ?? 0);
        const simbolo = (fin?.moneda?.simbolo ?? '').trim().toUpperCase();
        const denominacion = (fin?.moneda?.denominacion ?? '').trim().toUpperCase();
        if (simbolo.includes('GS') || denominacion.includes('GUARANI')) {
          gs += monto;
        } else if (simbolo.includes('R$') || simbolo.includes('RS') || denominacion.includes('REAL')) {
          rs += monto;
        } else {
          ds += monto;
        }
      }
      return { gs, rs, ds };
    }
    const monto = Number(preGasto?.montoSolicitado ?? 0);
    const simbolo = (preGasto?.moneda?.simbolo ?? '').trim().toUpperCase();
    const denominacion = (preGasto?.moneda?.denominacion ?? '').trim().toUpperCase();
    if (simbolo.includes('GS') || denominacion.includes('GUARANI')) {
      gs = monto;
    } else if (simbolo.includes('R$') || simbolo.includes('RS') || denominacion.includes('REAL')) {
      rs = monto;
    } else {
      ds = monto;
    }
    return { gs, rs, ds };
  }

  saveGastoRendicion(input: unknown): Observable<unknown> {
    return this.genericService.onSave(this.saveGastoRendicionGQL, input);
  }

  onCancelarGasto(id: number, sucId: number, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.cancelarGastoGQL, {
      id,
      sucId
    }, servidor);
  }

}
