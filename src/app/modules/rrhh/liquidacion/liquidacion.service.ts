import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { LiquidacionByIdGQL } from './graphql/LiquidacionById';
import { LiquidacionesPorFuncionarioGQL } from './graphql/LiquidacionesPorFuncionario';
import { LiquidacionesPorPeriodoGQL } from './graphql/LiquidacionesPorPeriodo';
import { LiquidacionesPageGQL } from './graphql/LiquidacionesPage';
import { LiquidacionItemsGQL } from './graphql/LiquidacionItems';
import { GenerarBorradorGQL } from './graphql/GenerarBorrador';
import { GenerarMesGQL } from './graphql/GenerarMes';
import { GenerarLoteGQL } from './graphql/GenerarLote';
import { ConceptosParaItemManualGQL } from './graphql/ConceptosParaItemManual';
import { AgregarItemGQL } from './graphql/AgregarItem';
import { EditarItemGQL } from './graphql/EditarItem';
import { EliminarItemGQL } from './graphql/EliminarItem';
import { AprobarLiquidacionGQL } from './graphql/AprobarLiquidacion';
import { VolverBorradorGQL } from './graphql/VolverBorrador';
import { PagarLiquidacionGQL } from './graphql/PagarLiquidacion';
import { AnularLiquidacionGQL } from './graphql/AnularLiquidacion';
import { ImprimirReciboLiquidacionGQL } from './graphql/ImprimirReciboLiquidacion';

@Injectable({ providedIn: 'root' })
export class LiquidacionService {

  constructor(
    private genericService: GenericCrudService,
    private liquidacionByIdGQL: LiquidacionByIdGQL,
    private liquidacionesPorFuncionarioGQL: LiquidacionesPorFuncionarioGQL,
    private liquidacionesPorPeriodoGQL: LiquidacionesPorPeriodoGQL,
    private liquidacionesPageGQL: LiquidacionesPageGQL,
    private liquidacionItemsGQL: LiquidacionItemsGQL,
    private generarBorradorGQL: GenerarBorradorGQL,
    private generarMesGQL: GenerarMesGQL,
    private generarLoteGQL: GenerarLoteGQL,
    private agregarItemGQL: AgregarItemGQL,
    private conceptosParaItemManualGQL: ConceptosParaItemManualGQL,
    private editarItemGQL: EditarItemGQL,
    private eliminarItemGQL: EliminarItemGQL,
    private aprobarLiquidacionGQL: AprobarLiquidacionGQL,
    private volverBorradorGQL: VolverBorradorGQL,
    private pagarLiquidacionGQL: PagarLiquidacionGQL,
    private anularLiquidacionGQL: AnularLiquidacionGQL,
    private imprimirReciboGQL: ImprimirReciboLiquidacionGQL
  ) { }

  onGetById(id: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionByIdGQL, { id }, servidor);
  }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionesPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  onGetPorPeriodo(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionesPorPeriodoGQL, { periodo }, servidor);
  }

  onGetItems(liquidacionId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionItemsGQL, { liquidacionId }, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, periodo?: string,
            estado?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.liquidacionesPageGQL,
      { page, size, funcionarioId, periodo, estado }, servidor);
  }

  onGenerarBorrador(funcionarioId: number, periodo: string, monedaId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarBorradorGQL, { funcionarioId, periodo, monedaId }, servidor);
  }

  onGenerarMes(periodo: string, monedaId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarMesGQL, { periodo, monedaId }, servidor);
  }

  /** Genera borradores para una lista de funcionarios (null = todos los activos). */
  onGenerarLote(funcionarioIds: number[], periodo: string, monedaId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarLoteGQL, { funcionarioIds, periodo, monedaId }, servidor);
  }

  onAgregarItem(liquidacionId: number, descripcion: string, monto: number, tipo: string,
                liquidacionConceptoId: number = null, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.agregarItemGQL,
      { liquidacionId, descripcion, monto, tipo, liquidacionConceptoId }, servidor);
  }

  /**
   * Catalogo de operaciones para el item manual.
   *
   * servidor=true es obligatorio: ese flag elige el cliente Apollo, y con false la query
   * sale por el cliente por defecto en vez del central. silentLoad evita el dialogo de
   * "Buscando..." — es una carga de fondo, no una accion del usuario.
   */
  onGetConceptosParaItemManual(servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.conceptosParaItemManualGQL, {}, servidor, null, true);
  }

  onEditarItem(itemId: number, descripcion: string, monto: number, tipo: string, usuarioId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.editarItemGQL, { itemId, descripcion, monto, tipo, usuarioId }, servidor);
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

  onImprimirRecibo(id: number, anchoMm: number | null = null, escpos = false, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.imprimirReciboGQL, { id, anchoMm, escpos }, servidor);
  }
}
