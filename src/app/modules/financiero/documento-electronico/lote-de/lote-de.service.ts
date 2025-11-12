import { map, Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EstadoLoteDE, LoteDE } from "./lote-de.model";
import { FindByLoteIdGQL } from "./graphql/findByLoteId";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { PageInfo } from "../../../../app.component";
import { OnGetAllLotesGQL } from "./graphql/onGetAllLotes";

@UntilDestroy({ checkProperties: true})
@Injectable({
  providedIn: 'root',
})
export class LoteDeService {
  constructor(
    private onGetAll: OnGetAllLotesGQL,
    private findByLoteId: FindByLoteIdGQL,
    private genericService: GenericCrudService
  ){}

  onGetAllLotes(
    page: number,
    size: number,
    estado?: EstadoLoteDE,
    fechaInicio?: Date,
    fechaFin?: Date,
    servidor: boolean = true
  ): Observable<PageInfo<LoteDE>> {
    return this.genericService.onCustomQuery(this.onGetAll, {
      page,
      size,
      estado: estado || null,
      fechaInicio: fechaInicio ? dateToString(fechaInicio) : null,
      fechaFin: fechaFin ? dateToString(fechaFin) : null
    }, servidor).pipe(
      map((res: any) => {
        const pageInfo = new PageInfo<LoteDE>();
        pageInfo.getContent = res.getContent || res;
        pageInfo.getTotalElements = res.getTotalElements || res.length;
        pageInfo.getNumberOfElements = res.getNumberOfElements || res.length;
        pageInfo.isFirst = res.isFirst !== undefined ? res.isFirst : page === 0;
        pageInfo.isLast = res.isLast !== undefined ? res.isLast : true;
        pageInfo.hasNext = res.hasNext !== undefined ? res.hasNext : false;
        pageInfo.hasPrevious = res.hasPrevious !== undefined ? res.hasPrevious : false;
        return pageInfo;
      })
    );
  }

  onGetAllLotesPaginado(page: number, size: number, servidor: boolean = true): Observable<LoteDE[]> {
    return this.genericService.onGetAll(this.onGetAll, page, size, servidor);
  }

  onFindByLoteId(id: number, servidor: boolean = true): Observable<LoteDE> {
    return this.genericService.onGetById(this.findByLoteId, id, servidor);
  }
}