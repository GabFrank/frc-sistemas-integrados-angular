import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { LiquidacionesFinalesPorFuncionarioGQL } from './graphql/LiquidacionesFinalesPorFuncionario';
import { LiquidacionFinalItemsGQL } from './graphql/LiquidacionFinalItems';
import { GenerarLiquidacionFinalGQL } from './graphql/GenerarLiquidacionFinal';
import { AprobarLiquidacionFinalGQL } from './graphql/AprobarLiquidacionFinal';
import { VolverBorradorLiquidacionFinalGQL } from './graphql/VolverBorradorLiquidacionFinal';
import { PagarLiquidacionFinalGQL } from './graphql/PagarLiquidacionFinal';
import { AnularLiquidacionFinalGQL } from './graphql/AnularLiquidacionFinal';
import { ImprimirReciboFinalGQL } from './graphql/ImprimirReciboFinal';
import { PreviewLiquidacionFinalGQL } from './graphql/PreviewLiquidacionFinal';
import { AgregarItemLiquidacionFinalGQL } from './graphql/AgregarItemLiquidacionFinal';
import { EditarItemLiquidacionFinalGQL } from './graphql/EditarItemLiquidacionFinal';
import { EliminarItemLiquidacionFinalGQL } from './graphql/EliminarItemLiquidacionFinal';

@Injectable({ providedIn: 'root' })
export class LiquidacionFinalService {

  constructor(
    private genericService: GenericCrudService,
    private porFuncionarioGQL: LiquidacionesFinalesPorFuncionarioGQL,
    private itemsGQL: LiquidacionFinalItemsGQL,
    private generarGQL: GenerarLiquidacionFinalGQL,
    private aprobarGQL: AprobarLiquidacionFinalGQL,
    private volverBorradorGQL: VolverBorradorLiquidacionFinalGQL,
    private pagarGQL: PagarLiquidacionFinalGQL,
    private anularGQL: AnularLiquidacionFinalGQL,
    private imprimirReciboFinalGQL: ImprimirReciboFinalGQL,
    private agregarItemGQL: AgregarItemLiquidacionFinalGQL,
    private editarItemGQL: EditarItemLiquidacionFinalGQL,
    private eliminarItemGQL: EliminarItemLiquidacionFinalGQL,
    private previewGQL: PreviewLiquidacionFinalGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.porFuncionarioGQL, { funcionarioId }, servidor);
  }

  onGetItems(liquidacionFinalId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.itemsGQL, { liquidacionFinalId }, servidor);
  }

  onGenerar(input: any, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarGQL, { input }, servidor);
  }

  onPreview(funcionarioId: number, fechaEgreso: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.previewGQL, { funcionarioId, fechaEgreso }, servidor);
  }

  onAprobar(id: number, aprobadoPorId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarGQL, { id, aprobadoPorId }, servidor);
  }

  onVolverBorrador(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.volverBorradorGQL, { id }, servidor);
  }

  onPagar(id: number, cajaVirtualId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.pagarGQL, { id, cajaVirtualId }, servidor);
  }

  onAnular(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.anularGQL, { id }, servidor);
  }

  onImprimirRecibo(id: number, anchoMm: number | null = null, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.imprimirReciboFinalGQL, { id, anchoMm }, servidor);
  }

  onAgregarItem(liquidacionFinalId: number, descripcion: string, monto: number, tipo: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.agregarItemGQL, { liquidacionFinalId, descripcion, monto, tipo }, servidor);
  }

  onEditarItem(itemId: number, descripcion: string, monto: number, tipo: string, usuarioId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.editarItemGQL, { itemId, descripcion, monto, tipo, usuarioId }, servidor);
  }

  onEliminarItem(itemId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.eliminarItemGQL, { itemId }, servidor);
  }
}
