import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SaveVentaTarjetaGQL, VentaTarjetaResult } from './graphql/saveVentaTarjeta';
import { CountVentasTarjetaSinRegistrarDesktopGQL } from './graphql/countVentasTarjetaSinRegistrar';
import { CancelarVentaTarjetaPorVentaIdGQL } from './graphql/cancelarVentaTarjetaPorVentaId';
import { FiltrarVentasTarjetaGQL } from './graphql/filtrarVentasTarjeta';
import { ImprimirReporteVentaTarjetaGQL } from './graphql/imprimirReporteVentaTarjeta';
import { MarcarVentasTarjetaNoCompletadasGQL } from './graphql/marcarVentasTarjetaNoCompletadas';
import { VentaTarjetaPorIdGQL } from './graphql/ventaTarjetaPorId';
import { CompletarVentaTarjetaGQL } from './graphql/completarVentaTarjeta';
import { CobroDetalleDeVenta, CobrosTarjetaDeVentaGQL } from './graphql/cobrosTarjetaDeVenta';
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

@Injectable({ providedIn: 'root' })
export class VentaTarjetaService {

  constructor(
    private genericService: GenericCrudService,
    private saveVentaTarjetaGQL: SaveVentaTarjetaGQL,
    private countVentasTarjetaGQL: CountVentasTarjetaSinRegistrarDesktopGQL,
    private cancelarVentaTarjetaGQL: CancelarVentaTarjetaPorVentaIdGQL,
    private filtrarVentasTarjetaGQL: FiltrarVentasTarjetaGQL,
    private imprimirReporteVentaTarjetaGQL: ImprimirReporteVentaTarjetaGQL,
    private marcarVentasTarjetaNoCompletadasGQL: MarcarVentasTarjetaNoCompletadasGQL,
    private ventaTarjetaPorIdGQL: VentaTarjetaPorIdGQL,
    private completarVentaTarjetaGQL: CompletarVentaTarjetaGQL,
    private cobrosTarjetaDeVentaGQL: CobrosTarjetaDeVentaGQL,
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

  onCancelarPorVentaId(ventaId: number, sucId: number): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.cancelarVentaTarjetaGQL,
      { ventaId, sucId },
      false,
      true
    );
  }

  onMarcarNoCompletadas(cajaId: number, sucId: number): Observable<number> {
    return this.genericService.onCustomMutation(
      this.marcarVentasTarjetaNoCompletadasGQL,
      { cajaId, sucId },
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
        this.reporteService.onAdd('Reporte de Ventas con Tarjeta', res);
        this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListVentaTarjetaComponent));
      }
    });
  }
}
