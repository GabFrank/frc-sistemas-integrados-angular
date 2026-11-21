import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PageInfo } from '../../../app.component';
import { HistorialCambiosGQL } from './graphql/historialCambios';
import { HistorialCambiosCategoriasGQL } from './graphql/historialCambiosCategorias';
import { FiltrosHistorialCambios, HistorialCambio, HistorialCambioCategoria } from './modificaciones.models';

/** Historial de cambios del sistema (pantalla «Modificaciones»): los textos los arma el central. */
@Injectable({
  providedIn: 'root'
})
export class ModificacionesService {

  constructor(
    private genericService: GenericCrudService,
    private historialCambios: HistorialCambiosGQL,
    private historialCambiosCategorias: HistorialCambiosCategoriasGQL
  ) { }

  onHistorialCambios(filtros: FiltrosHistorialCambios, page: number, size: number): Observable<PageInfo<HistorialCambio>> {
    return this.genericService.onCustomQuery(this.historialCambios, { ...filtros, page, size });
  }

  onCategorias(): Observable<HistorialCambioCategoria[]> {
    return this.genericService.onCustomQuery(this.historialCambiosCategorias, {});
  }
}
