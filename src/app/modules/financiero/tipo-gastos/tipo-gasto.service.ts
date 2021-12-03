import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllTipoGastosGQL } from './graphql/AllTipoGastos';
import { DeleteTipoGastoGQL } from './graphql/deleleTipoGasto';
import { saveTipoGasto } from './graphql/graphql-query';
import { RootTipoGastosGQL } from './graphql/rootTipoGasto';
import { SaveTipoGastoGQL } from './graphql/saveTipoGasto';
import { TipoGastoPorIdGQL } from './graphql/tipoGastoPorId';
import { TipoGasto } from './list-tipo-gastos/tipo-gasto.model';

@Injectable({
  providedIn: 'root'
})
export class TipoGastoService {

  constructor(
    private genericService: GenericCrudService,
    private getAllTipoGastos: AllTipoGastosGQL,
    private getRootTipoGasto: RootTipoGastosGQL,
    private onSaveTipoGasto: SaveTipoGastoGQL,
    private tipoGastoPorId: TipoGastoPorIdGQL,
    private deleteTipoGasto: DeleteTipoGastoGQL
  ) { }

  onGetAll(): Observable<any> {
    return this.genericService.onGetAll(this.getAllTipoGastos);
  }

  onGetRoot(): Observable<any>{
    return this.genericService.onGetAll(this.getRootTipoGasto);
  }

  onSave(input): Observable<any> {
    return this.genericService.onSave(this.onSaveTipoGasto, input);
  }

  onGetById(id): Observable<any>{
    return this.genericService.onGetById(this.tipoGastoPorId, id);
  }

  onDelete(id): Observable<any>{
    return this.genericService.onDelete(this.deleteTipoGasto, id);
  }
}
