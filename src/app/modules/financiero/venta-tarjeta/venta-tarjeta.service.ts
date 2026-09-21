import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SaveVentaTarjetaGQL, VentaTarjetaResult } from './graphql/saveVentaTarjeta';
import { CountVentasTarjetaSinRegistrarDesktopGQL } from './graphql/countVentasTarjetaSinRegistrar';
import { MotivoCuponNoUsableGQL } from './graphql/motivoCuponNoUsable';
import { FiltrarVentasTarjetaPorCajaGQL } from './graphql/filtrarVentasTarjetaPorCaja';
import { CancelarVentaTarjetaPorVentaIdGQL } from './graphql/cancelarVentaTarjetaPorVentaId';
import { FiltrarVentasTarjetaGQL } from './graphql/filtrarVentasTarjeta';
import { ImprimirReporteVentaTarjetaGQL } from './graphql/imprimirReporteVentaTarjeta';
import { MarcarVentasTarjetaNoCompletadasGQL } from './graphql/marcarVentasTarjetaNoCompletadas';
import { MarcarVentaTarjetaNoCompletadaGQL } from './graphql/marcarVentaTarjetaNoCompletada';
import { ReabrirVentaTarjetaGQL } from './graphql/reabrirVentaTarjeta';
import { VentaTarjetaPorIdGQL } from './graphql/ventaTarjetaPorId';
import { CompletarVentaTarjetaGQL } from './graphql/completarVentaTarjeta';
import { CobroDetalleDeVenta, CobrosTarjetaDeVentaGQL } from './graphql/cobrosTarjetaDeVenta';
import { ImprimirSenaCuponGQL } from './graphql/imprimirSenaCupon';
import { VentaTarjetaCompletaPorIdGQL } from './graphql/ventaTarjetaCompletaPorId';
import { ConfiguracionService } from '../../../shared/services/configuracion.service';
import { codificarQr } from '../../../shared/qr-code/qr-code.component';
import { TipoEntidad } from '../../../generics/tipo-entidad.enum';
import { PageInfo } from '../../../app.component';
import { VentaTarjeta } from './venta-tarjeta.model';
import { MainService } from '../../../main.service';
import { ReporteService } from '../../reportes/reporte.service';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { ReportesComponent } from '../../reportes/reportes/reportes.component';
import { ListVentaTarjetaComponent } from './list-venta-tarjeta/list-venta-tarjeta.component';

/** Datos que aporta el QR impreso por el POS. Ver CompletarVentaTarjetaInput del filial. */
export interface CompletarVentaTarjetaInput {
  id: number;
  sucursalId: number;
  codigoAutorizacion?: string;
  numeroBoleta?: string;
  montoEscaneado?: number;
  identificadorTransaccion?: string;
  qrCrudo?: string;
  /**
   * Cobro elegido por el usuario. Cuando va, el backend NO infiere: es el único camino
   * cuando la venta tiene dos cobros con tarjeta del mismo monto.
   */
  cobroDetalleId?: number;
  /** Moneda que declara el cupón. El backend bloquea si no es la del cobro. */
  monedaId?: number;
  /**
   * De dónde salieron los datos: `QR` | `OCR` | `MANUAL`. No todos los orígenes merecen la misma
   * confianza —un código leído por OCR puede tener un carácter mal— y sin esto la columna queda
   * nula y no hay forma de saber qué revisar.
   */
  origen?: string;
  /**
   * Captura por foto que produjo estos datos. El filial copia su imagen a la venta, y eso es lo
   * que después impide que la purga se lleve puesta la evidencia de un cobro.
   */
  capturaToken?: string;
  /**
   * Los campos que el cupón trae y que NO tienen columna propia, como JSON.
   *
   * Es lo que `venta_tarjeta.datos_extra` existe para guardar: un proveedor que imprime un segundo
   * monto en otra moneda, un `STONEID`, un código de comercio. El OCR ya los separa — sin esto se
   * descartaban y la columna quedaba vacía para siempre.
   */
  datosExtra?: string;
}

export interface VentaTarjetaInput {
  sucursalId: number;
  ventaId: number;
  cajaId: number;
  monto: number;
  estado: string;
  terminalPosId?: number;
  /** Moneda del cobro que respalda. Sin ella el monto queda sin unidad. */
  monedaId?: number;
  usuarioId?: number;
}

/**
 * Lo que hace falta para imprimir la seña de un cobro con tarjeta que quedó sin cupón.
 *
 * Son los valores planos que tiene a mano quien cierra la venta. A propósito no recibe un
 * `VentaTarjeta`: la mutation `saveVentaTarjeta` sólo devuelve `id, sucursalId, estado, monto,
 * creadoEn`, así que el objeto con el que se arma la seña NO tiene ni la venta ni la caja.
 */
export interface SenaCuponData {
  ventaId: number;
  ventaTarjetaId: number;
  sucursalId: number;
  cajaId?: number;
  cajero?: string;
  terminal?: string;
  monto?: number;
  monedaSimbolo?: string;
  decimales?: number;
}

@Injectable({ providedIn: 'root' })
export class VentaTarjetaService {

  constructor(
    private genericService: GenericCrudService,
    private saveVentaTarjetaGQL: SaveVentaTarjetaGQL,
    private countVentasTarjetaGQL: CountVentasTarjetaSinRegistrarDesktopGQL,
    private motivoCuponNoUsableGQL: MotivoCuponNoUsableGQL,
    private filtrarVentasTarjetaPorCajaGQL: FiltrarVentasTarjetaPorCajaGQL,
    private cancelarVentaTarjetaGQL: CancelarVentaTarjetaPorVentaIdGQL,
    private filtrarVentasTarjetaGQL: FiltrarVentasTarjetaGQL,
    private imprimirReporteVentaTarjetaGQL: ImprimirReporteVentaTarjetaGQL,
    private marcarVentasTarjetaNoCompletadasGQL: MarcarVentasTarjetaNoCompletadasGQL,
    private marcarVentaTarjetaNoCompletadaGQL: MarcarVentaTarjetaNoCompletadaGQL,
    private reabrirVentaTarjetaGQL: ReabrirVentaTarjetaGQL,
    private ventaTarjetaPorIdGQL: VentaTarjetaPorIdGQL,
    private completarVentaTarjetaGQL: CompletarVentaTarjetaGQL,
    private cobrosTarjetaDeVentaGQL: CobrosTarjetaDeVentaGQL,
    private imprimirSenaCuponGQL: ImprimirSenaCuponGQL,
    private ventaTarjetaCompletaPorIdGQL: VentaTarjetaCompletaPorIdGQL,
    private configService: ConfiguracionService,
    private mainService: MainService,
    private reporteService: ReporteService,
    private tabService: TabService
  ) {}

  onSavePendiente(input: VentaTarjetaInput): Observable<VentaTarjetaResult> {
    return this.genericService.onCustomMutation(this.saveVentaTarjetaGQL, { entity: input }, false);
  }

  /**
   * Completa un PENDIENTE con lo leido del cupon. Va contra el FILIAL (servidor=false): el PDV
   * tiene que poder registrar sin internet, igual que cobra sin internet.
   */
  onCompletar(input: CompletarVentaTarjetaInput): Observable<VentaTarjeta> {
    return this.genericService.onCustomMutation(this.completarVentaTarjetaGQL, { input }, false);
  }

  /**
   * Cobros con TARJETA de una venta, para elegir a cuál pertenece el cupón.
   *
   * servidor=false a propósito: la venta y sus cobros viven en el FILIAL, que es el mismo
   * backend contra el que corre onCompletar. Pedirlos al central traería ids que la mutation
   * no podría resolver.
   */
  onGetCobrosTarjetaDeVenta(ventaId: number, sucId: number): Observable<CobroDetalleDeVenta[]> {
    return this.genericService
      .onCustomQuery(this.cobrosTarjetaDeVentaGQL, { id: ventaId, sucId }, false, null, true)
      .pipe(
        map((venta: any) => (venta?.cobro?.cobroDetalleList ?? []).filter(
          (cd: CobroDetalleDeVenta) =>
            cd?.formaPago?.descripcion === 'TARJETA' && cd.pago && !cd.vuelto && !cd.descuento
        ))
      );
  }

  /**
   * Ventas con tarjeta de una caja, contra el FILIAL (`servidor = false`, tercer argumento).
   *
   * Local a proposito: el PDV tiene que poder operar sin internet, y `completarVentaTarjeta`
   * corre igual contra el filial. Listar contra el central para despues completar contra el
   * filial era incoherente, y ademas exponia las ventas de las otras sucursales.
   */
  /**
   * Ventas con tarjeta de una caja, paginadas y filtradas. Contra el FILIAL.
   *
   * `cajaId` y `sucId` los acota el servidor, no el cliente: la pantalla no puede ver otra caja
   * ni otra sucursal aunque se manipulen los filtros.
   */
  onFiltrarPorCaja(params: {
    cajaId: number; sucId: number; estado?: string; terminalPosId?: number; monedaId?: number;
    montoDesde?: number; montoHasta?: number; usuarioId?: number; page?: number; size?: number;
  }): Observable<PageInfo<VentaTarjeta>> {
    return this.genericService.onCustomQuery(
      this.filtrarVentasTarjetaPorCajaGQL,
      params,
      false,
      null,
      true
    );
  }

  /**
   * Motivo por el que el cupon no se puede usar, o null si esta libre. Contra el FILIAL.
   *
   * Es un ADELANTO del aviso, no la validacion: el backend vuelve a chequear al guardar y esa es
   * la que manda. Por eso el que llama tiene que tratar un error de red como "seguir": bloquear
   * el escaneo porque no se pudo consultar seria peor que el problema que resuelve.
   */
  onMotivoCuponNoUsable(
    qrCrudo: string,
    identificadorTransaccion: string,
    sucId: number,
    codigoAutorizacion?: string,
    terminalPosId?: number
  ): Observable<string> {
    return this.genericService.onCustomQuery(
      this.motivoCuponNoUsableGQL,
      { qrCrudo, identificadorTransaccion, sucId, codigoAutorizacion, terminalPosId },
      false,
      null,
      true
    );
  }

  onCountSinRegistrar(cajaId: number, sucId: number): Observable<number> {
    return this.genericService.onCustomQuery(
      this.countVentasTarjetaGQL,
      { cajaId, sucId },
      false,
      null,
      true
    );
  }

  onGetEstadoPorId(id: number, sucId: number): Observable<VentaTarjeta> {
    return this.genericService.onCustomQuery(
      this.ventaTarjetaPorIdGQL,
      { id, sucId },
      false,
      null,
      true
    );
  }

  /**
   * El cobro completo, por id. Contra el FILIAL.
   *
   * Distinta de `onGetEstadoPorId`, que trae sólo el estado para un poller. Ésta trae todo lo que el
   * diálogo de completar necesita, y existe para el escaneo de la seña: el QR puede apuntar a una
   * fila que no está en la página cargada de la tabla.
   */
  onGetCompletaPorId(id: number, sucId: number): Observable<VentaTarjeta> {
    return this.genericService.onCustomQuery(
      this.ventaTarjetaCompletaPorIdGQL,
      { id, sucId },
      false,
      null,
      true
    );
  }

  onCancelarPorVentaId(ventaId: number, sucId: number): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.cancelarVentaTarjetaGQL,
      { ventaId, sucId },
      false,
      true
    );
  }

  /**
   * Imprime la seña de un cobro con tarjeta que quedó sin cupón.
   *
   * Va contra el FILIAL, por la misma impresora y el mismo camino que el ticket de la venta
   * (`venta.service.onSaveVenta` manda este mismo `printerName` y este mismo `local`). No hay un
   * segundo mecanismo de impresión.
   *
   * El QR se arma **acá**, no en el backend: el contrato de esa cadena vive en `codificarQr()` y lo
   * comparte el mobile. Y se arma **desde estos escalares**, no desde objetos anidados.
   *
   * ⚠️ Hubo un helper --`construirQrPayloadVentaTarjeta()`, borrado el 2026-09-21 junto con el QR
   * de la app móvil-- que leía `item.venta?.id` e `item.caja?.id`. En este flujo esos objetos **no
   * existen**: el filial devuelve los escalares y `saveVentaTarjeta` ni siquiera los devuelve. Usar
   * algo así acá produciría un QR con `idOrigen: undefined` **sin lanzar ningún error**. Si alguna
   * vez se escribe un armador compartido, tiene que partir de escalares por este motivo.
   *
   * Nunca lanza: devuelve false si el papel no salió. Para cuando esto corre, la venta ya se guardó.
   */
  onImprimirSena(datos: SenaCuponData): Observable<boolean> {
    // ⚠️ Sin impresora configurada NO se llama al filial. `printSenaCupon` devolvería `false` --su
    // `getPrintService(null)` no encuentra nada-- y el cajero vería "no se pudo imprimir" sin
    // ninguna pista de que el problema es la configuración de ESTA caja, no la impresora. Medido
    // el 2026-09-16: la config guardada del perfil de prueba no tenía el bloque `printers`, porque
    // se guardó antes de que existiera, y `getConfig()?.printers?.ticket` daba `undefined`.
    const impresora = this.configService?.getConfig()?.printers?.ticket;
    if (!impresora) {
      return throwError(() => new Error(
        'No hay impresora de tickets configurada en esta caja (Configuración → Impresora Ticket).'
      ));
    }

    // `data` es posicional: cajaId|monto|ventaTarjetaId. El mobile hace split('|') y lee por indice.
    // El separador interno es '|' porque codificarQr une los campos con '-'.
    const qr = codificarQr({
      sucursalId: datos.sucursalId,
      tipoEntidad: TipoEntidad.VENTA_TARJETA,
      idOrigen: datos.ventaId,
      idCentral: datos.ventaId,
      componentToOpen: 'RegistroVentaTarjetaComponent',
      data: (datos.cajaId ?? '') + '|' + datos.monto + '|' + datos.ventaTarjetaId,
      timestamp: Date.now(),
    });

    return this.genericService.onCustomMutation(this.imprimirSenaCuponGQL, {
      input: {
        ventaId: datos.ventaId,
        ventaTarjetaId: datos.ventaTarjetaId,
        cajaId: datos.cajaId,
        cajero: datos.cajero,
        terminal: datos.terminal,
        monto: datos.monto,
        monedaSimbolo: datos.monedaSimbolo,
        decimales: datos.decimales,
        qr,
      },
      printerName: impresora,
      local: this.configService?.getConfig()?.local,
    }, false);
  }

  /**
   * Deja sin conciliar TODOS los pendientes de una caja, con su motivo.
   *
   * El motivo es lo único que va a existir cuando alguien revise esa caja después: `NO_COMPLETADO`
   * es terminal y esa plata queda sin cupón contra el cual conciliar la liquidación del proveedor.
   */
  onMarcarNoCompletadas(
    cajaId: number,
    sucId: number,
    motivo: string,
    observacion: string,
    usuarioId: number
  ): Observable<number> {
    return this.genericService.onCustomMutation(
      this.marcarVentasTarjetaNoCompletadasGQL,
      { cajaId, sucId, motivo, observacion, usuarioId },
      false
    );
  }

  /**
   * Deja UN cobro sin conciliar.
   *
   * El caso real es por cobro y no por caja: de tres pendientes, dos tienen su cupón y el tercero
   * se perdió. Marcar los tres con el mismo motivo sería escribir dos mentiras para registrar una
   * verdad.
   */
  onMarcarNoCompletada(
    id: number,
    sucId: number,
    motivo: string,
    observacion: string,
    usuarioId: number
  ): Observable<VentaTarjeta> {
    return this.genericService.onCustomMutation(
      this.marcarVentaTarjetaNoCompletadaGQL,
      { id, sucId, motivo, observacion, usuarioId },
      false
    );
  }

  /**
   * Devuelve un cobro de `NO_COMPLETADO` a `PENDIENTE`.
   *
   * <b>No limpia el rastro.</b> El filial conserva las `noCompletado*` y agrega quién reabrió y
   * cuándo: borrarlas destruiría justamente lo que §8 existe para guardar, y la fila volvería a
   * decir sólo «pendiente» como si nunca la hubieran dado por perdida.
   *
   * Contra el FILIAL (`false`), como completar y marcar. Desde un cliente contra central no hay
   * link local y esto no tiene a dónde ir — por eso el diálogo se abre en modo lectura ahí.
   */
  onReabrir(id: number, sucId: number, usuarioId: number): Observable<VentaTarjeta> {
    return this.genericService.onCustomMutation(
      this.reabrirVentaTarjetaGQL,
      { id, sucId, usuarioId },
      false
    );
  }

  onFiltrar(params: {
    id?: number; ventaId?: number; sucursalId?: number; terminalDescripcion?: string; terminalCodigo?: string;
    estado?: string; fechaDesde?: string; fechaHasta?: string; page?: number; size?: number;
  }): Observable<PageInfo<VentaTarjeta>> {
    return this.genericService.onCustomQuery(this.filtrarVentasTarjetaGQL, params, true, null, true);
  }

  onImprimirReporteVentaTarjeta(params: {
    id?: number; ventaId?: number; sucursalId?: number; terminalDescripcion?: string; terminalCodigo?: string;
    estado?: string; fechaDesde?: string; fechaHasta?: string;
  }, servidor = true): void {
    this.genericService.onCustomQuery(this.imprimirReporteVentaTarjetaGQL, {
      ...params,
      usuarioResponsableId: this.mainService.usuarioActual?.id
    }, servidor).subscribe(res => {
      if (res != null) {
        this.reporteService.onAdd('Reporte de conciliación de cupones', res);
        this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListVentaTarjetaComponent));
      }
    });
  }
}
