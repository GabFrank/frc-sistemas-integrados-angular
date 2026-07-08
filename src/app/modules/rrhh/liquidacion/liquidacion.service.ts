import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { LiquidacionesPorFuncionarioGQL } from './graphql/LiquidacionesPorFuncionario';
import { LiquidacionesPorPeriodoGQL } from './graphql/LiquidacionesPorPeriodo';
import { LiquidacionItemsGQL } from './graphql/LiquidacionItems';
import { GenerarBorradorGQL } from './graphql/GenerarBorrador';
import { GenerarMesGQL } from './graphql/GenerarMes';
import { AgregarItemGQL } from './graphql/AgregarItem';
import { EliminarItemGQL } from './graphql/EliminarItem';
import { AprobarLiquidacionGQL } from './graphql/AprobarLiquidacion';
import { VolverBorradorGQL } from './graphql/VolverBorrador';
import { PagarLiquidacionGQL } from './graphql/PagarLiquidacion';
import { AnularLiquidacionGQL } from './graphql/AnularLiquidacion';

@Injectable({ providedIn: 'root' })
export class LiquidacionService {

  constructor(
    private genericService: GenericCrudService,
    private liquidacionesPorFuncionarioGQL: LiquidacionesPorFuncionarioGQL,
    private liquidacionesPorPeriodoGQL: LiquidacionesPorPeriodoGQL,
    private liquidacionItemsGQL: LiquidacionItemsGQL,
    private generarBorradorGQL: GenerarBorradorGQL,
    private generarMesGQL: GenerarMesGQL,
    private agregarItemGQL: AgregarItemGQL,
    private eliminarItemGQL: EliminarItemGQL,
    private aprobarLiquidacionGQL: AprobarLiquidacionGQL,
    private volverBorradorGQL: VolverBorradorGQL,
    private pagarLiquidacionGQL: PagarLiquidacionGQL,
    private anularLiquidacionGQL: AnularLiquidacionGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionesPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  onGetPorPeriodo(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionesPorPeriodoGQL, { periodo }, servidor);
  }

  onGetItems(liquidacionId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionItemsGQL, { liquidacionId }, servidor);
  }

  onGenerarBorrador(funcionarioId: number, periodo: string, monedaId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarBorradorGQL, { funcionarioId, periodo, monedaId }, servidor);
  }

  onGenerarMes(periodo: string, monedaId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarMesGQL, { periodo, monedaId }, servidor);
  }

  onAgregarItem(liquidacionId: number, descripcion: string, monto: number, tipo: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.agregarItemGQL, { liquidacionId, descripcion, monto, tipo }, servidor);
  }

  onEliminarItem(itemId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.eliminarItemGQL, { itemId }, servidor);
  }

  onAprobar(id: number, aprobadoPorId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarLiquidacionGQL, { id, aprobadoPorId }, servidor);
  }

  onVolverBorrador(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.volverBorradorGQL, { id }, servidor);
  }

  onPagar(id: number, cajaVirtualId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.pagarLiquidacionGQL, { id, cajaVirtualId }, servidor);
  }

  onAnular(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.anularLiquidacionGQL, { id }, servidor);
  }
}
