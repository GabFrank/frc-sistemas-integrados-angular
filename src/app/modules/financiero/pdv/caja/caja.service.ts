import { MainService } from "./../../../../main.service";
import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, defaultIfEmpty, map, switchMap, take } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { MotivoDialogComponent, MotivoDialogData } from "../../../../shared/components/motivo-dialog/motivo-dialog.component";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { ROLES } from "../../../personas/roles/roles.enum";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError, SIN_AVISO_DEL_GENERICO, TIMEOUT_CONSULTA_MOSTRADOR_MS } from "../../../../generics/generic-crud.service";
import {
  CajaBalance,
  PdvCaja,
  PdvCajaEstado,
  PdvCajaInput,
  PdvCajaReapertura,
} from "./caja.model";
import { CajaPorIdGQL } from "./graphql/cajaPorId";
import { CajaPorUsuarioIdAndAbiertoGQL } from "./graphql/cajaPorUsuarioIdAndAbierto";
import { CajasPorFechaGQL } from "./graphql/cajasPorFecha";
import { DeleteCajaGQL } from "./graphql/deleleCaja";
import { ImprimirBalanceGQL } from "./graphql/imprimirBalance";
import { SaveCajaGQL } from "./graphql/saveCaja";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BalancePorFechaGQL } from "./graphql/balancePorFecha";
import { environment } from "../../../../../environments/environment";
import { BalancePorCajaIdGQL } from "./graphql/imprimirBalance copy";
import { CajasWithFiltersGQL } from "./graphql/cajaWithFilters";
import { CajasWithFiltersActivoGQL } from "./graphql/cajaWithFiltersActivo";
import { CajasAnalisisDiferenciasGQL } from "../../analisis-diferencia/graphql/cajasAnalisisDiferencias";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { BalancePorCajaIdAndSucursalIdGQL } from "./graphql/balancePorCajaIdAndSucursalId";
import { CajaSimplePorIdGQL } from "./graphql/cajaSimplePorId";
import { VerificarCajaGQL } from "./graphql/verificarCaja";
import { CajaAbiertoPorSucursalGQL } from "./graphql/cajaAbiertoPorSucursal";
import { CajerosConCajaAbiertaGQL } from "./graphql/cajerosConCajaAbierta";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";
import { ImpresionPosService } from "../../../../shared/services/impresion-pos/impresion-pos.service";
import { TransferirCajaGQL } from "./graphql/transferirCaja";
import { ReabrirCajaDesdeServidorGQL } from "./graphql/reabrirCaja";
import { ReaperturasPorCajaGQL } from "./graphql/reaperturasPorCaja";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CajaService {
  selectedCaja: PdvCaja;

  constructor(
    private genericService: GenericCrudService,
    private cajasPorFecha: CajasPorFechaGQL,
    private onSaveCaja: SaveCajaGQL,
    private cajaPorId: CajaPorIdGQL,
    private cajaSimplePorId: CajaSimplePorIdGQL,
    private deleteCaja: DeleteCajaGQL,
    private cajaPorUsuarioIdAndAbierto: CajaPorUsuarioIdAndAbiertoGQL,
    private imprimirBalance: ImprimirBalanceGQL,
    private mainService: MainService,
    private balancePorFecha: BalancePorFechaGQL,
    private balancePorCajaId: BalancePorCajaIdGQL,
    private cajasWithFilters: CajasWithFiltersGQL,
    private cajasWithFiltersActivo: CajasWithFiltersActivoGQL,
    private cajasAnalisisDiferencias: CajasAnalisisDiferenciasGQL,
    private balancePorCajaIdAndSucursalId: BalancePorCajaIdAndSucursalIdGQL,
    private verificarCaja: VerificarCajaGQL,
    private cajaAbiertoPorSucursal: CajaAbiertoPorSucursalGQL,
    private cajerosConCajaAbierta: CajerosConCajaAbiertaGQL,
    private configService: ConfiguracionService,
    private transferirCaja: TransferirCajaGQL,
    private reabrirCaja: ReabrirCajaDesdeServidorGQL,
    private reaperturasPorCaja: ReaperturasPorCajaGQL,
    private matDialog: MatDialog,
    private notificacionBar: NotificacionSnackbarService,
    private impresionPos: ImpresionPosService
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllCajas);
  // }

  /** `silentLoad`: para quien carga en segundo plano, sin el modal «Buscando…». */
  onCajaBalancePorId(id: number, servidor: boolean = true, silentLoad?: boolean, warningText?: string): Observable<CajaBalance> {
    return this.genericService.onGetById(this.balancePorCajaId, id, null, null, servidor, null, null, null, silentLoad,
      null, warningText);
  }

  onCajaBalancePorIdAndSucursalId(id: number, sucId: number, servidor: boolean = true,
                                  errorConf?: QueryError, contexto?: ContextoConsulta): Observable<CajaBalance> {
    return this.genericService.onCustomQuery(this.balancePorCajaIdAndSucursalId, { id, sucId }, servidor, errorConf ?? null,
      true, contexto);
  }

  onGetCajasWithFilters(
    cajaId: number,
    estado: PdvCajaEstado,
    maletinId: number,
    cajeroId: number,
    fechaInicio: Date,
    fechaFin: Date,
    sucId: number,
    verificado: boolean,
    activo: boolean,
    page: number,
    size: number,
    servidor: boolean = true,
    errorConf?: QueryError,
    contexto?: ContextoConsulta
  ) {
    // Preparar los parámetros, convirtiendo null/undefined a null explícitamente
    const queryParams: any = {
      cajaId: cajaId || null,
      estado: estado || null,
      maletinId: maletinId || null,
      cajeroId: cajeroId || null,
      fechaInicio: fechaInicio ? dateToString(fechaInicio) : null,
      fechaFin: fechaFin ? dateToString(fechaFin) : null,
      sucId: sucId || null,
      verificado: verificado !== null && verificado !== undefined ? verificado : null,
      page: page || 0,
      size: size || 15
    };
    
    // Abiertas/Cerradas (#599) va solo al central: el filial no conoce `activo`. Con TODAS se manda la
    // query de siempre, que también anda contra un central que todavía no lo tiene.
    let query: CajasWithFiltersGQL | CajasWithFiltersActivoGQL = this.cajasWithFilters;
    if (activo != null && (servidor == null || servidor)) {
      queryParams.activo = activo;
      query = this.cajasWithFiltersActivo;
    }

    // errorConf/contexto: solo Últimas cajas del POS (#390); list-caja no los pasa y queda como antes.
    return this.genericService.onCustomQuery(query, queryParams, servidor, errorConf, undefined, contexto);
  }

  onGetCajasAnalisisDiferencias(
    cajaId: number,
    cajaAnteriorId: number,
    estado: PdvCajaEstado,
    maletinId: number,
    maletinDescripcion: string,
    cajeroId: number,
    fechaInicio: Date,
    fechaFin: Date,
    sucId: number,
    verificado: boolean,
    page: number,
    size: number,
    difEstado: string = null,
    servidor: boolean = true,
    errorConf?: QueryError,
    contexto?: ContextoConsulta
  ) {
    return this.genericService.onCustomQuery(this.cajasAnalisisDiferencias, {
      cajaId,
      cajaAnteriorId,
      estado,
      maletinId,
      maletinDescripcion,
      cajeroId,
      fechaInicio: dateToString(fechaInicio),
      fechaFin: dateToString(fechaFin),
      sucId,
      verificado,
      page,
      size,
      difEstado
    }, servidor, errorConf, undefined, contexto);
  }

  onGetByDate(inicio?: Date, fin?: Date, sucId?, servidor: boolean = true): Observable<PdvCaja[]> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date();
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date();
      fin = hoy;
    }
    return this.genericService.onGetByFecha(
      this.cajasPorFecha,
      inicio,
      fin,
      servidor,
      sucId
    );
  }

  onGetBalanceByDate(
    inicio?: Date,
    fin?: Date,
    sucId?,
    servidor: boolean = true
  ): Observable<CajaBalance> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date();
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date();
      fin = hoy;
    }
    return this.genericService.onGetByFecha(
      this.balancePorFecha,
      inicio,
      fin,
      servidor,
      sucId
    );
  }

  onSave(input: PdvCajaInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.onSaveCaja, input, null, null, servidor);
  }

  onGetById(id, sucId?, silentLoad?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(
      this.cajaPorId,
      id,
      null,
      null,
      servidor,
      sucId,
      null
    );
  }

  onGetByIdSimp(id, sucId?, silentLoad?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(
      this.cajaSimplePorId,
      id,
      null,
      null,
      servidor,
      sucId,
      null
    );
  }

  onGetByUsuarioIdAndAbierto(id, sucId?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(
      this.cajaPorUsuarioIdAndAbierto,
      id,
      null,
      null, servidor,
      sucId
    );
  }

  /**
   * La caja abierta del usuario, para saber si un alta que quedó sin respuesta (o fue rechazada) dejó una caja
   * creada. A diferencia de {@link onGetByUsuarioIdAndAbierto}, termina siempre: `null` es «no tiene», y si no se
   * pudo consultar falla (sin aviso; corte de mostrador). Sin modal, salvo que se pida (#390).
   */
  onGetAbiertaDelUsuario(usuarioId: number, servidor: boolean = true, conModal = false): Observable<PdvCaja | null> {
    return this.genericService.onGetById(
      this.cajaPorUsuarioIdAndAbierto, usuarioId, null, null, servidor, null, null, null, !conModal, null, null,
      { graphError: { show: false, propagate: true }, networkError: { show: false, propagate: true } },
      { timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS, silenciarAvisoTimeout: true }
    );
  }

  onDelete(id, showDialog?: boolean, servidor: boolean = true): Observable<any> {
    return this.genericService.onDelete(this.deleteCaja, id, "¿Eliminar caja?", null, showDialog, servidor, "¿Está seguro que desea eliminar esta caja?");
  }

  onImprimirBalance(id, sucId?, servidor: boolean = true) {
    if (this.impresionPos.porCliente(servidor)) {
      // "Imprimir desde esta PC": la filial arma el balance y se imprime acá.
      return this.impresionPos.imprimirTicket("BALANCE", id, "El balance de la caja");
    }
    if (servidor !== false && sucId != null && this.impresionPos.imprimeEstaPc()) {
      // "Imprimir Cierre" contra el central en modo "Imprimir desde esta PC": el central arma el
      // mismo balance y se imprime acá.
      return this.impresionPos.imprimirTicketCentral("BALANCE", id, sucId, "El cierre de caja");
    }
    console.log('imprimir balance', 'id', id, 'printerName', this.configService.getConfig().printers["ticket"], 'local', this.configService.getConfig().local, 'sucId', sucId);
    return this.genericService
      .onCustomQuery(this.imprimirBalance, {id, printerName: this.configService.getConfig().printers["ticket"], local: this.configService.getConfig().local, sucId},
        servidor, PROPAGAR_ERROR_DE_RED, null, this.impresionPos.contextoImpresionServidor)
      .pipe(this.impresionPos.avisarSinRespuesta("la impresión del balance"));
  }

  onVerificarCaja(cajaId, sucursalId, usuarioId, verificado, servidor: boolean = true) {
    return this.genericService.onCustomQuery(this.verificarCaja, { cajaId, sucursalId, usuarioId, verificado }, servidor)
  }

  /**
   * Obtiene las cajas abiertas de una sucursal con sus balances
   * @param sucursalId ID de la sucursal
   * @returns Observable con un array de cajas abiertas con sus balances
   */
  onGetCajasAbiertasPorSucursal(sucursalId: number, servidor: boolean = true): Observable<PdvCaja[]> {
    return this.genericService.onCustomQuery(
      this.cajaAbiertoPorSucursal,
      { sucursalId },
      servidor,
      null,
      true
    );
  }

  /**
   * Los cajeros que hoy estan en caja en la sucursal. El filtro y la deduplicacion los hace el
   * central: no alcanza con activo = true, que incluye cajas que quedaron abiertas hace anios.
   */
  onGetCajerosConCajaAbierta(sucursalId: number, servidor: boolean = true): Observable<Usuario[]> {
    return this.genericService.onCustomQuery(
      this.cajerosConCajaAbierta,
      { sucursalId },
      servidor,
      null,
      true
    );
  }

  onTransferirCaja(cajaId: number, usuarioId: number, servidor: boolean = false): Observable<any> {
    return this.genericService.onCustomMutation(this.transferirCaja, { cajaId, usuarioId }, servidor);
  }

  /**
   * Reabre una caja cerrada por equivocacion (#662). Siempre por el central, que la reenvia a la
   * filial duena de la caja. Solo ADMIN, con motivo; si la filial la rechaza, el aviso trae el motivo.
   */
  onReabrirCaja(cajaId: number, sucursalId: number, motivo: string): Observable<any> {
    return this.genericService.onCustomMutation(this.reabrirCaja, { cajaId, sucursalId, motivo }, true);
  }

  /**
   * Reaperturas de la caja (#662), siempre del central. Sin cargando ni avisos: es un dato extra del
   * resumen y, si falla, el resumen se muestra igual sin ese bloque.
   */
  onGetReaperturas(cajaId: number, sucursalId: number): Observable<PdvCajaReapertura[]> {
    return this.genericService.onCustomQuery(this.reaperturasPorCaja, { cajaId, sucursalId }, true,
      SIN_AVISO_DEL_GENERICO, true);
  }

  /**
   * Muestra «Reabrir caja»: ADMIN y caja cerrada sin verificar. El resto de las reglas (mismo dia,
   * maletin, cajero con otra caja) las valida la filial y su rechazo explica el motivo.
   */
  puedeReabrir(caja: PdvCaja): boolean {
    return caja != null
      && caja.verificado !== true
      && (caja.conteoCierre != null || caja.fechaCierre != null || caja.activo === false)
      && this.mainService.tieneAlgunRol([ROLES.ADMIN]);
  }

  /** Pide el motivo y reabre la caja. Emite true si quedo reabierta. */
  reabrirConMotivo(caja: PdvCaja): Observable<boolean> {
    if (caja?.id == null || caja.sucursalId == null) return of(false);
    const data: MotivoDialogData = {
      titulo: "Reabrir caja " + caja.id,
      mensaje: "La caja vuelve a quedar abierta para que el cajero siga vendiendo y la cierre de nuevo.",
      detalle: "El cierre actual se descarta (queda en el historial) y se registra quién la reabrió y por qué.",
      etiqueta: "Motivo de la reapertura",
      botonConfirmar: "Sí, reabrir",
    };
    return this.matDialog.open(MotivoDialogComponent, { data, width: "520px", maxWidth: "95vw" }).afterClosed().pipe(
      take(1),
      switchMap((motivo: string | null) => motivo
        ? this.onReabrirCaja(+caja.id, +caja.sucursalId, motivo).pipe(
          map((res) => {
            const ok = res?.exito === true;
            if (ok) {
              this.notificacionBar.notification$.next({
                texto: "Caja " + caja.id + " reabierta: el cajero puede seguir vendiendo en ella.",
                color: NotificacionColor.success,
                duracion: 4,
              });
            }
            return ok;
          }),
          // El aviso del rechazo (con su motivo) ya lo dio el generico.
          catchError(() => of(false)))
        : of(false)),
      defaultIfEmpty(false),
    );
  }
}
