import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ModificacionRegistro, ModificacionDetalle } from './modificaciones.models';
import { ModificacionesPorSchemaGQL } from './graphql/modificacionesPorSchema';
import { ModificacionesPorTipoEntidadGQL } from './graphql/modificacionesPorTipoEntidad';
import { ModificacionRegistroGQL } from './graphql/modificacionRegistro';
import { DetallesModificacionGQL } from './graphql/detallesModificacion';
import { PageInfo, Pageable } from '../../../app.component';
import { dateToString } from '../../../commons/core/utils/dateUtils';

@Injectable({
  providedIn: 'root'
})
export class ModificacionesService {

  constructor(
    private genericService: GenericCrudService,
    private modificacionesPorSchema: ModificacionesPorSchemaGQL,
    private modificacionesPorTipoEntidad: ModificacionesPorTipoEntidadGQL,
    private modificacionRegistro: ModificacionRegistroGQL,
    private detallesModificacion: DetallesModificacionGQL
  ) { }

  onModificacionesPorSchema(
    schemaNombre: string,
    inicio: Date,
    fin: Date,
    page: number = 0,
    size: number = 15
  ): Observable<PageInfo<ModificacionRegistro>> {
    return this.genericService.onCustomQuery(
      this.modificacionesPorSchema,
      {
        schemaNombre: schemaNombre,
        inicio: dateToString(inicio),
        fin: dateToString(fin),
        page: page,
        size: size
      },
      true
    ).pipe(
      map((response: any) => this.mapToPageInfo(response))
    );
  }

  onModificacionesPorTipoEntidad(
    tipoEntidad: string,
    page: number = 0,
    size: number = 15
  ): Observable<PageInfo<ModificacionRegistro>> {
    return this.genericService.onCustomQuery(
      this.modificacionesPorTipoEntidad,
      {
        tipoEntidad: tipoEntidad,
        page: page,
        size: size
      },
      true
    ).pipe(
      map((response: any) => this.mapToPageInfo(response))
    );
  }

  onGetModificacionRegistro(id: number): Observable<ModificacionRegistro> {
    return this.genericService.onGetById(this.modificacionRegistro, id, null, null, true);
  }
  onGetDetallesModificacion(modificacionRegistroId: number): Observable<ModificacionDetalle[]> {
    return this.genericService.onCustomQuery(
      this.detallesModificacion,
      {
        modificacionRegistroId: modificacionRegistroId
      },
      true
    );
  }
  private mapToPageInfo(response: any): PageInfo<ModificacionRegistro> {
    const pageInfo = new PageInfo<ModificacionRegistro>();
    pageInfo.getContent = response.content || [];
    pageInfo.getTotalElements = response.totalElements || 0;
    pageInfo.getTotalPages = response.totalPages || 0;
    pageInfo.getNumberOfElements = response.content?.length || 0;
    pageInfo.isFirst = response.pageNumber === 0;
    pageInfo.isLast = response.pageNumber >= (response.totalPages - 1);
    pageInfo.hasNext = response.pageNumber < (response.totalPages - 1);
    pageInfo.hasPrevious = response.pageNumber > 0;

    const pageable = new Pageable();
    pageable.getPageNumber = response.pageNumber || 0;
    pageable.getPageSize = response.pageSize || 15;
    pageInfo.getPageable = pageable;

    return pageInfo;
  }
}
