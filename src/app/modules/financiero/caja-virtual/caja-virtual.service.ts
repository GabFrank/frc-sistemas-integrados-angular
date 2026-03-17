import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PageInfo } from '../../../app.component';
import { CajaVirtual, CajaVirtualTipo, MovimientoCajaVirtual } from './caja-virtual.model';
import { CajaVirtualesGQL } from './graphql/cajaVirtuales';
import { CajaVirtualesPorTipoGQL } from './graphql/cajaVirtualesPorTipo';
import { CajaVirtualesActivasGQL } from './graphql/cajaVirtualesActivas';
import { SaveCajaVirtualGQL } from './graphql/saveCajaVirtual';
import { DeleteCajaVirtualGQL } from './graphql/deleteCajaVirtual';
import { SaveMovimientoCajaVirtualGQL } from './graphql/saveMovimientoCajaVirtual';
import { MovimientosCajaVirtualGQL, MovimientosCajaVirtualPorFechaGQL } from './graphql/movimientosCajaVirtual';
import { RealizarTransferenciaCajaVirtualGQL } from './graphql/realizarTransferenciaCajaVirtual';

@Injectable({
  providedIn: 'root'
})
export class CajaVirtualService {

  constructor(
    private genericService: GenericCrudService,
    private cajaVirtualesGQL: CajaVirtualesGQL,
    private cajaVirtualesPorTipoGQL: CajaVirtualesPorTipoGQL,
    private cajaVirtualesActivasGQL: CajaVirtualesActivasGQL,
    private saveCajaVirtualGQL: SaveCajaVirtualGQL,
    private deleteCajaVirtualGQL: DeleteCajaVirtualGQL,
    private saveMovimientoGQL: SaveMovimientoCajaVirtualGQL,
    private movimientosGQL: MovimientosCajaVirtualGQL,
    private movimientosPorFechaGQL: MovimientosCajaVirtualPorFechaGQL,
    private realizarTransferenciaGQL: RealizarTransferenciaCajaVirtualGQL,
  ) { }

  onGetAll(page = 0, size = 10): Observable<PageInfo<CajaVirtual>> {
    return this.genericService.onCustomQuery(this.cajaVirtualesGQL, { page, size });
  }

  onGetPorTipo(tipo: CajaVirtualTipo): Observable<CajaVirtual[]> {
    return this.genericService.onCustomQuery(this.cajaVirtualesPorTipoGQL, { tipo });
  }

  onGetActivas(): Observable<CajaVirtual[]> {
    return this.genericService.onCustomQuery(this.cajaVirtualesActivasGQL, {});
  }

  onSave(cajaVirtual: CajaVirtual): Observable<CajaVirtual> {
    let aux = cajaVirtual;
    if (!(cajaVirtual instanceof CajaVirtual)) {
      aux = new CajaVirtual();
      Object.assign(aux, cajaVirtual);
    }
    return this.genericService.onSaveCustom(this.saveCajaVirtualGQL, { input: aux.toInput() });
  }

  onDelete(id: number): Observable<boolean> {
    return this.genericService.onSaveCustom(this.deleteCajaVirtualGQL, { id });
  }

  onGetMovimientos(cajaVirtualId: number, page = 0, size = 20): Observable<PageInfo<MovimientoCajaVirtual>> {
    return this.genericService.onCustomQuery(this.movimientosGQL, { cajaVirtualId, page, size });
  }

  onGetMovimientosPorFecha(cajaVirtualId: number, inicio: string, fin: string, page = 0, size = 20): Observable<PageInfo<MovimientoCajaVirtual>> {
    return this.genericService.onCustomQuery(this.movimientosPorFechaGQL, { cajaVirtualId, inicio, fin, page, size });
  }

  onSaveMovimiento(movimiento: MovimientoCajaVirtual): Observable<MovimientoCajaVirtual> {
    let aux = movimiento;
    if (!(movimiento instanceof MovimientoCajaVirtual)) {
      aux = new MovimientoCajaVirtual();
      Object.assign(aux, movimiento);
    }
    return this.genericService.onSaveCustom(this.saveMovimientoGQL, { input: aux.toInput() });
  }

  onRealizarTransferencia(origenId: number, destinoId: number, cantidad: number, monedaId: number, descripcion?: string, usuarioId?: number): Observable<boolean> {
    return this.genericService.onSaveCustom(this.realizarTransferenciaGQL, {
      origenId, destinoId, cantidad, monedaId, descripcion, usuarioId
    });
  }
}
