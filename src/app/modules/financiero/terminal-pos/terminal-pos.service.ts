import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AllTerminalPosGQL } from './graphql/allTerminalPos';
import { CountTerminalPosGQL } from './graphql/countTerminalPos';
import { DeleteTerminalPosGQL } from './graphql/deleteTerminalPos';
import { FilterTerminalPosGQL } from './graphql/filterTerminalPos';
import { SaveTerminalPosGQL } from './graphql/saveTerminalPos';
import { SearchTerminalPosGQL } from './graphql/searchTerminalPos';
import { TerminalPos, TerminalPosInput } from './terminal-pos.model';

@Injectable({
  providedIn: 'root'
})
export class TerminalPosService {

  constructor(
    private genericCrud: GenericCrudService,
    private getAllTerminalPos: AllTerminalPosGQL,
    private saveTerminalPosGQL: SaveTerminalPosGQL,
    private deleteTerminalPosGQL: DeleteTerminalPosGQL,
    private searchTerminalPosGQL: SearchTerminalPosGQL,
    private filterTerminalPosGQL: FilterTerminalPosGQL,
    private countTerminalPosGQL: CountTerminalPosGQL
  ) { }

  onCount(servidor: boolean = true): Observable<number> {
    return this.genericCrud.onCustomQuery(this.countTerminalPosGQL, null, servidor);
  }

  onGetAll(page?, size?, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onGetAll(this.getAllTerminalPos, page, size, servidor);
  }

  onSearch(texto, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onGetByTexto(this.searchTerminalPosGQL, texto, servidor);
  }

  onFilter(descripcion, codigo, activo, page = 0, size = 10, servidor: boolean = true): Observable<PageInfo<TerminalPos>> {
    return this.genericCrud.onCustomQuery(this.filterTerminalPosGQL, { descripcion, codigo, activo, page, size }, servidor);
  }

  onSave(input: TerminalPosInput, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onSave(this.saveTerminalPosGQL, input, null, null, servidor);
  }

  onDelete(id, servidor: boolean = true): Observable<any> {
    return this.genericCrud.onDelete(this.deleteTerminalPosGQL, id, '¿Eliminar terminal POS?', null, true, servidor, '¿Está seguro que desea eliminar esta terminal POS?');
  }

}
