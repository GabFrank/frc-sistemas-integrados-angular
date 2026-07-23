import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SaveVentaTarjetaGQL, VentaTarjetaResult } from './graphql/saveVentaTarjeta';
import { CountVentasTarjetaSinRegistrarDesktopGQL } from './graphql/countVentasTarjetaSinRegistrar';
import { CancelarVentaTarjetaPorVentaIdGQL } from './graphql/cancelarVentaTarjetaPorVentaId';
import { FiltrarVentasTarjetaGQL } from './graphql/filtrarVentasTarjeta';
import { ImprimirReporteVentaTarjetaGQL } from './graphql/imprimirReporteVentaTarjeta';
import { MarcarVentasTarjetaNoCompletadasGQL } from './graphql/marcarVentasTarjetaNoCompletadas';
import { PageInfo } from '../../../app.component';
import { VentaTarjeta } from './venta-tarjeta.model';
import { MainService } from '../../../main.service';
import { ReporteService } from '../../reportes/reporte.service';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { ReportesComponent } from '../../reportes/reportes/reportes.component';
import { ListVentaTarjetaComponent } from './list-venta-tarjeta/list-venta-tarjeta.component';

export interface VentaTarjetaInput {
  sucursalId: number;
  ventaId: number;
  cajaId: number;
  monto: number;
  estado: string;
  terminalPosId?: number;
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
    private mainService: MainService,
    private reporteService: ReporteService,
    private tabService: TabService
  ) {}

  onSavePendiente(input: VentaTarjetaInput): Observable<VentaTarjetaResult> {
    return this.genericService.onCustomMutation(this.saveVentaTarjetaGQL, { entity: input }, false);
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
