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
    ).pipe(
      map((response: any) => {
        return response.data || response || [];
      })
    );
  }
  private mapToPageInfo(response: any): PageInfo<ModificacionRegistro> {
    const data = response.data || response;

    const pageInfo = new PageInfo<ModificacionRegistro>();
    pageInfo.getContent = data.content || [];
    pageInfo.getTotalElements = data.totalElements || 0;
    pageInfo.getTotalPages = data.totalPages || 0;
    pageInfo.getNumberOfElements = data.content?.length || 0;
    pageInfo.isFirst = data.pageNumber === 0;
    pageInfo.isLast = data.pageNumber >= (data.totalPages - 1);
    pageInfo.hasNext = data.pageNumber < (data.totalPages - 1);
    pageInfo.hasPrevious = data.pageNumber > 0;

    const pageable = new Pageable();
    pageable.getPageNumber = data.pageNumber || 0;
    pageable.getPageSize = data.pageSize || 15;
    pageInfo.getPageable = pageable;

    return pageInfo;
  }
}
