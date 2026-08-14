import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PageInfo } from '../../../app.component';
import { CajaVirtual, CajaVirtualTipo, CajaVirtualTipoMovimiento, MovimientoCajaVirtual,
         CajaVirtualSaldoItem, CuentaBancariaResumen, CajaVirtualConfiguracion, CajaVirtualConfiguracionInput } from './caja-virtual.model';
import { CajaVirtualesGQL } from './graphql/cajaVirtuales';
import { CajaVirtualesFilterGQL } from './graphql/cajaVirtualesFilter';
import { CajaVirtualesPorTipoGQL } from './graphql/cajaVirtualesPorTipo';
import { CajaVirtualesActivasGQL } from './graphql/cajaVirtualesActivas';
import { SaveCajaVirtualGQL } from './graphql/saveCajaVirtual';
import { DeleteCajaVirtualGQL } from './graphql/deleteCajaVirtual';
import { SaveMovimientoCajaVirtualGQL } from './graphql/saveMovimientoCajaVirtual';
import { MovimientosCajaVirtualGQL, MovimientosCajaVirtualPorFechaGQL } from './graphql/movimientosCajaVirtual';
import { RealizarTransferenciaCajaVirtualGQL } from './graphql/realizarTransferenciaCajaVirtual';
import { AnularMovimientoCajaVirtualGQL } from './graphql/anularMovimientoCajaVirtual';
import { CajaVirtualSaldosGQL } from './graphql/cajaVirtualSaldos';
import { CajaVirtualResumenBancarioGQL } from './graphql/cajaVirtualResumenBancario';
import { MovimientosCajaVirtualFilterGQL } from './graphql/movimientosCajaVirtualFilter';
import { CajaVirtualConfiguracionGQL } from './graphql/cajaVirtualConfiguracion';
import { SaveCajaVirtualConfiguracionGQL } from './graphql/saveCajaVirtualConfiguracion';

@Injectable({
  providedIn: 'root'
})
export class CajaVirtualService {

  constructor(
    private genericService: GenericCrudService,
    private cajaVirtualesGQL: CajaVirtualesGQL,
    private cajaVirtualesFilterGQL: CajaVirtualesFilterGQL,
    private cajaVirtualesPorTipoGQL: CajaVirtualesPorTipoGQL,
    private cajaVirtualesActivasGQL: CajaVirtualesActivasGQL,
    private saveCajaVirtualGQL: SaveCajaVirtualGQL,
    private deleteCajaVirtualGQL: DeleteCajaVirtualGQL,
    private saveMovimientoGQL: SaveMovimientoCajaVirtualGQL,
    private movimientosGQL: MovimientosCajaVirtualGQL,
    private movimientosPorFechaGQL: MovimientosCajaVirtualPorFechaGQL,
    private realizarTransferenciaGQL: RealizarTransferenciaCajaVirtualGQL,
    private anularMovimientoGQL: AnularMovimientoCajaVirtualGQL,
    private saldosGQL: CajaVirtualSaldosGQL,
    private resumenBancarioGQL: CajaVirtualResumenBancarioGQL,
    private movimientosFilterGQL: MovimientosCajaVirtualFilterGQL,
    private configuracionGQL: CajaVirtualConfiguracionGQL,
    private saveConfiguracionGQL: SaveCajaVirtualConfiguracionGQL,
  ) { }

  onGetAll(page = 0, size = 10): Observable<PageInfo<CajaVirtual>> {
    return this.genericService.onCustomQuery(this.cajaVirtualesGQL, { page, size });
  }

  onGetFilter(filtros: { nombre?: string; tipo?: CajaVirtualTipo; sucursalId?: number; activo?: boolean },
              page = 0, size = 10): Observable<PageInfo<CajaVirtual>> {
    return this.genericService.onCustomQuery(this.cajaVirtualesFilterGQL, {
      nombre: filtros.nombre ?? null,
      tipo: filtros.tipo ?? null,
      sucursalId: filtros.sucursalId ?? null,
      activo: filtros.activo ?? null,
      page, size
    });
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

  onAnularMovimiento(id: number, motivo?: string): Observable<MovimientoCajaVirtual> {
    return this.genericService.onSaveCustom(this.anularMovimientoGQL, { id, motivo });
  }

  onGetSaldos(cajaVirtualId: number): Observable<CajaVirtualSaldoItem[]> {
    return this.genericService.onCustomQuery(this.saldosGQL, { cajaVirtualId });
  }

  onGetResumenBancario(cajaVirtualId: number): Observable<CuentaBancariaResumen[]> {
    return this.genericService.onCustomQuery(this.resumenBancarioGQL, { cajaVirtualId });
  }

  onGetMovimientosFilter(cajaVirtualId: number,
                         filtros: { desde?: string; fin?: string; tipo?: CajaVirtualTipoMovimiento; soloActivos?: boolean },
                         page = 0, size = 15): Observable<PageInfo<MovimientoCajaVirtual>> {
    return this.genericService.onCustomQuery(this.movimientosFilterGQL, {
      cajaVirtualId,
      desde: filtros.desde ?? null,
      fin: filtros.fin ?? null,
      tipo: filtros.tipo ?? null,
      soloActivos: filtros.soloActivos ?? false,
      page, size
    });
  }

  onGetConfiguracion(cajaVirtualId: number): Observable<CajaVirtualConfiguracion> {
    return this.genericService.onCustomQuery(this.configuracionGQL, { cajaVirtualId });
  }

  onSaveConfiguracion(input: CajaVirtualConfiguracionInput): Observable<CajaVirtualConfiguracion> {
    return this.genericService.onSaveCustom(this.saveConfiguracionGQL, { input });
  }

  onRealizarTransferencia(origenId: number, destinoId: number, cantidad: number, monedaId: number, descripcion?: string, usuarioId?: number): Observable<boolean> {
    return this.genericService.onSaveCustom(this.realizarTransferenciaGQL, {
      origenId, destinoId, cantidad, monedaId, descripcion, usuarioId
    });
  }
}
