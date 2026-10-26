import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CargosGQL } from './graphql/Cargos';
import { CargosSearchGQL } from './graphql/CargosSearch';
import { CargosWithPageGQL } from './graphql/CargosWithPage';
import { SaveCargoGQL } from './graphql/SaveCargo';
import { DeleteCargoGQL } from './graphql/DeleteCargo';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Cargo } from './cargo.model';
import { PageInfo } from '../../../app.component';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../shared/components/search-list-dialog/search-list-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class CargoService {

  constructor(
    private genericService: GenericCrudService,
    private getAllCargos: CargosGQL,
    private cargosSearch: CargosSearchGQL,
    private cargosWithPage: CargosWithPageGQL,
    private saveCargoGQL: SaveCargoGQL,
    private deleteCargoGQL: DeleteCargoGQL,
    private matDialog: MatDialog
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllCargos, null, null, servidor);
  }

  onSearch(texto, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.cargosSearch, texto, servidor);
  }

  /** Lista del ABM: pagina y filtra en el backend. onGetAll/onSearch quedan para los selectores. */
  onGetAllWithPage(page: number, size: number, texto?: string, servidor = true): Observable<PageInfo<Cargo>> {
    return this.genericService.onCustomQuery(this.cargosWithPage, { page, size, texto }, servidor);
  }

  /**
   * Buscador generico de cargos (paginado en el backend). Emite solo si se elige uno.
   * excluirId saca un cargo de los resultados: en "depende de" el propio cargo, al cambiar
   * de cargo el actual.
   */
  onBuscarCargo(excluirId?: number): Observable<Cargo> {
    const data: SearchListtDialogData = {
      titulo: 'Buscar cargo',
      tableData: [
        { id: 'id', nombre: 'Id', width: '10%' },
        { id: 'nombre', nombre: 'Nombre', width: '35%' },
        { id: 'descripcion', nombre: 'Descripción', width: '40%' },
        { id: 'sueldoBase', nombre: 'Sueldo base', width: '15%', pipe: 'number', pipeArgs: '1.0-0' }
      ],
      query: this.cargosWithPage,
      paginator: true,
      inicialSearch: true,
      filtro: excluirId != null ? (c: Cargo) => c.id !== excluirId : undefined
    };
    return this.matDialog.open(SearchListDialogComponent, { data, height: '80vh', width: '70vw', restoreFocus: true })
      .afterClosed().pipe(filter(res => res != null));
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
