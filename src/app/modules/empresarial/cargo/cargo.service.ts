import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CargosGQL } from './graphql/Cargos';
import { CargosSearchGQL } from './graphql/CargosSearch';
import { SaveCargoGQL } from './graphql/SaveCargo';
import { DeleteCargoGQL } from './graphql/DeleteCargo';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Cargo } from './cargo.model';

@Injectable({
  providedIn: 'root'
})
export class CargoService {

  constructor(
    private genericService: GenericCrudService,
    private getAllCargos: CargosGQL,
    private cargosSearch: CargosSearchGQL,
    private saveCargoGQL: SaveCargoGQL,
    private deleteCargoGQL: DeleteCargoGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllCargos, null, null, servidor);
  }

  onSearch(texto, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.cargosSearch, texto, servidor);
  }

  onSave(input: any, servidor = true): Observable<Cargo> {
    return this.genericService.onSave<Cargo>(this.saveCargoGQL, input, null, null, servidor);
  }

  /**
   * El backend rechaza con GraphQLException si el cargo esta en uso (funcionarios,
   * historico o subcargos) y ese mensaje llega solo al snackbar. Sin ese chequeo previo,
   * CrudService.deleteById devolveria false en silencio y la UI diria "eliminado con exito".
   */
  onDelete(id: number, servidor = true): Observable<any> {
    return this.genericService.onDelete(this.deleteCargoGQL, id, null, null, false, servidor);
  }
}
