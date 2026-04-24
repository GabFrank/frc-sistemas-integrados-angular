import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllTipoGastosGQL } from './graphql/AllTipoGastos';
import { DeleteTipoGastoGQL } from './graphql/deleleTipoGasto';
import { saveTipoGasto, tipoGastosSearch } from './graphql/graphql-query';
import { RootTipoGastosGQL } from './graphql/rootTipoGasto';
import { SaveTipoGastoGQL } from './graphql/saveTipoGasto';
import { TipoGastoPorIdGQL } from './graphql/tipoGastoPorId';
import { TipoGastoSearchGQL } from './graphql/tipoGastosSearch';
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
    private deleteTipoGasto: DeleteTipoGastoGQL,
    private tipoGastoSearch: TipoGastoSearchGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllTipoGastos, null, null, servidor);
  }

  onGetRoot(servidor = true): Observable<any>{
    return this.genericService.onGetAll(this.getRootTipoGasto, null, null, servidor);
  }

  onSave(input, servidor = true): Observable<any> {
    return this.genericService.onSave(this.onSaveTipoGasto, input, null, null, servidor);
  }

  onGetById(id, servidor = true): Observable<any>{
    return this.genericService.onGetById(this.tipoGastoPorId, id, null, null, servidor);
  }

  onDelete(id, servidor = true): Observable<any>{
    return this.genericService.onDelete(this.deleteTipoGasto, id, "¿Eliminar tipo de gasto?", null, true, servidor, "¿Está seguro que desea eliminar este tipo de gasto?");
  }

  onSearch(texto, servidor = true): Observable<any>{
    return this.genericService.onGetByTexto(this.tipoGastoSearch, texto, servidor);
  }
}
