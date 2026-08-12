import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Banco } from './banco.model';
import { BancosGQL } from './graphql/bancos';
import { SaveBancoGQL } from './graphql/saveBanco';
import { DeleteBancoGQL } from './graphql/deleteBanco';

@Injectable({
  providedIn: 'root'
})
export class BancoService {

  constructor(
    private genericService: GenericCrudService,
    private bancosGQL: BancosGQL,
    private saveBancoGQL: SaveBancoGQL,
    private deleteBancoGQL: DeleteBancoGQL,
  ) { }

  onGetAll(page = 0, size = 100): Observable<Banco[]> {
    return this.genericService.onCustomQuery(this.bancosGQL, { page, size });
  }

  onSave(banco: Banco): Observable<Banco> {
    let aux = banco;
    if (!(banco instanceof Banco)) {
      aux = new Banco();
      Object.assign(aux, banco);
    }
    return this.genericService.onSaveCustom(this.saveBancoGQL, { banco: aux.toInput() });
  }

  onDelete(id: number): Observable<boolean> {
    return this.genericService.onSaveCustom(this.deleteBancoGQL, { id });
  }
}
