import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DashboardRrhhKpisGQL } from './graphql/DashboardRrhhKpis';

@Injectable({ providedIn: 'root' })
export class DashboardRrhhService {

  constructor(
    private genericService: GenericCrudService,
    private kpisGQL: DashboardRrhhKpisGQL
  ) { }

  onGetKpis(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.kpisGQL, { periodo }, servidor);
  }
}
