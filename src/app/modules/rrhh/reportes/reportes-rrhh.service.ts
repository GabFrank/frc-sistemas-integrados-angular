import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ReporteNominaMesGQL } from './graphql/ReporteNominaMes';
import { ReporteResumenIpsGQL } from './graphql/ReporteResumenIps';

@Injectable({ providedIn: 'root' })
export class ReportesRrhhService {

  constructor(
    private genericService: GenericCrudService,
    private nominaGQL: ReporteNominaMesGQL,
    private ipsGQL: ReporteResumenIpsGQL
  ) { }

  onNominaMes(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.nominaGQL, { periodo }, servidor);
  }

  onResumenIps(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.ipsGQL, { periodo }, servidor);
  }
}
