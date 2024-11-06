import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { CobroDetalleInput } from '../../operaciones/venta/cobro/cobro-detalle.model';
import { ListVentaComponent } from '../../operaciones/venta/list-venta/list-venta.component';
import { ReporteService } from '../../reportes/reporte.service';
import { ReportesComponent } from '../../reportes/reportes/reportes.component';
import { CancelarVentaCreditoGQL } from './graphql/cancelarVentaCredito';
import { CobrarVentaCreditoGQL } from './graphql/cobrarVentaCredito';
import { FinalizarVentaCreditoGQL } from './graphql/finalizarVentaCredito';
import { ReporteCobroVentaCreditoGQL } from './graphql/imprimirReporteCobro';
import { ImprimirVentaCreditoGQL } from './graphql/imprimirVentaCredito';
import { SaveVentaCreditoByIdGQL } from './graphql/saveVentaCredito';
import { VentaCreditoPorClienteGQL } from './graphql/ventaCreditoPorCliente';
import { VentaCreditoByIdGQL } from './graphql/ventaCreditoPorId';
import { VentaCreditoQrSubAuthGQL } from './graphql/ventaCreditoQrSub';
import { EstadoVentaCredito, VentaCredito, VentaCreditoCuotaInput, VentaCreditoInput } from './venta-credito.model';
import { PageInfo } from '../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class VentaCreditoService {

  constructor(
    private genericService: GenericCrudService,
    private getVentaCredito: VentaCreditoByIdGQL,
    private saveVentaCredito: SaveVentaCreditoByIdGQL,
    private ventaCreditoQrAuthSub: VentaCreditoQrSubAuthGQL,
    private ventaCreditoPorCliente: VentaCreditoPorClienteGQL,
    private imprimirVentaCredito: ImprimirVentaCreditoGQL,
    private cobrarVentaCredito: CobrarVentaCreditoGQL,
    private finalizarVentaCredito: FinalizarVentaCreditoGQL,
    private cancelarVentaCredito: CancelarVentaCreditoGQL,
    private imprimirReporteCobroVentaCredito: ReporteCobroVentaCreditoGQL,
    private reporteService: ReporteService,
    private tabService: TabService
  ) { }

  onGetPorCliente(id: number, fechaInicio: string, fechaFin: string, estado: EstadoVentaCredito, cobro: boolean): Observable<VentaCredito[]> {
    return this.genericService.onCustomQuery(this.ventaCreditoPorCliente, { id, fechaInicio, fechaFin, estado, cobro }, true);
  }

  onSave(input: VentaCreditoInput, itens: VentaCreditoCuotaInput[]): Observable<any> {
    return this.genericService.onSaveConDetalle(this.saveVentaCredito, input, itens);
  }

  ventaCreditoQrSub() {
    return this.genericService.onCustomSub(this.ventaCreditoQrAuthSub, null, true, false);
  }

  onImprimirVentaCredito(id: number, sucId): Observable<boolean> {
    return this.genericService.onCustomQuery(this.imprimirVentaCredito, { id, sucId, printerName: environment['printers']['ticket'] })
  }

  onCobrarVentaCredito(ventaCreditoInputList: VentaCreditoInput[], cobroDetalleInputList: CobroDetalleInput[]) {
    return this.genericService.onSaveCustom(this.cobrarVentaCredito, { ventaCreditoInputList, cobroList: cobroDetalleInputList });
  }

  onFinalizarVentaCredito(id, sucId): Observable<boolean> {
    return this.genericService.onCustomMutation(this.finalizarVentaCredito, { id, sucId }, true);
  }

  onCancelarVentaCredito(id, sucId): Observable<boolean> {
    return this.genericService.onCustomMutation(this.cancelarVentaCredito, { id, sucId }, true);
  }

  onImprimirReporteCobro(clienteId: number, ventaCreditoInputList: VentaCreditoInput[], usuarioId: number) {
    this.genericService.onCustomQuery(this.imprimirReporteCobroVentaCredito, {
      clienteId,
      ventaCreditoInputList,
      usuarioId
    }, true).subscribe(res => {
      if (res != null) {
        this.reporteService.onAdd('VC del cliente '+ clienteId, res)
        this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListVentaComponent))
      }
    })
  }
}
