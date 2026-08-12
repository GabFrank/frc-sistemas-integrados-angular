import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { CajaVirtualesActivasGQL } from './graphql/CajaVirtualesActivas';

@Injectable({ providedIn: 'root' })
export class CajaVirtualService {
  constructor(
    private genericService: GenericCrudService,
    private cajaVirtualesActivasGQL: CajaVirtualesActivasGQL
  ) { }

  onGetActivas(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.cajaVirtualesActivasGQL, null, null, servidor);
  }
}
