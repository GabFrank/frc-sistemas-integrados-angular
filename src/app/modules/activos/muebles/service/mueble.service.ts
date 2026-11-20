import { Injectable, inject, Injector } from '@angular/core';
import { DeleteMuebleGQL } from '../graphql/deleteMueble';
import { MuebleSearchPageGQL } from '../graphql/muebleSearchPage';
import { BehaviorSubject, Observable } from 'rxjs';
import { Mueble } from '../models/mueble.model';
import { MuebleInput } from '../models/mueble-input.model';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { MuebleByIdGQL } from '../graphql/muebleById';
import { SaveMuebleGQL } from '../graphql/saveMueble';
import { FamiliaMuebleByIdGQL } from '../graphql/familiaMuebleById';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { MuebleDialogService } from './mueble-dialog-service.service';
import { AdicionarFamiliaMuebleDialogComponent } from '../dialogs/adicionar-familia-mueble-dialog/adicionar-familia-mueble-dialog.component';
import { AdicionarTipoMuebleDialogComponent } from '../dialogs/adicionar-tipo-mueble-dialog/adicionar-tipo-mueble-dialog.component';
import { FamiliaMuebleSearchGQL } from '../graphql/familiaMuebleSearch';
import { TipoMuebleSearchGQL } from '../graphql/tipoMuebleSearch';
import { FamiliaMuebleSearchPageGQL } from '../graphql/familiaMuebleSearchPage';
import { TipoMuebleSearchPageGQL } from '../graphql/tipoMuebleSearchPage';
import { SaveFamiliaMuebleGQL } from '../graphql/saveFamiliaMueble';
import { SaveTipoMuebleGQL } from '../graphql/saveTipoMueble';
import { SearchListDialogComponent, SearchListtDialogData, TableData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { FamiliaMueble } from '../models/familia-mueble.model';
import { TipoMueble } from '../models/tipo-mueble.model';
import { FamiliaMuebleInput } from '../models/familia-mueble-input.model';
import { TipoMuebleInput } from '../models/tipo-mueble-input.model';

@Injectable({
  providedIn: 'root'
})
export class MuebleService {
  private genericService = inject(GenericCrudService);
  private muebleByIdGQL = inject(MuebleByIdGQL);
  private saveMuebleGQL = inject(SaveMuebleGQL);
  private deleteMuebleGQL = inject(DeleteMuebleGQL);
  private familiaByIdGQL = inject(FamiliaMuebleByIdGQL);
  private muebleSearchPageGQL = inject(MuebleSearchPageGQL);
  private familiaSearchGQL = inject(FamiliaMuebleSearchGQL);
  private tipoMuebleSearchGQL = inject(TipoMuebleSearchGQL);
  private familiaSearchPageGQL = inject(FamiliaMuebleSearchPageGQL);
  private tipoMuebleSearchPageGQL = inject(TipoMuebleSearchPageGQL);
  private saveFamiliaGQL = inject(SaveFamiliaMuebleGQL);
  private saveTipoGQL = inject(SaveTipoMuebleGQL);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);

  private _searchText$ = new BehaviorSubject<string>('');
  public searchText$ = this._searchText$.asObservable();


  /** Lista paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  readonly pag = new PaginacionLista<Mueble>({
    cargar: (page, size) => this.onFiltrar(this._searchText$.value, page, size),
    pageSize: 15,
  });
  public muebles$ = this.pag.items$;
  public loading$ = this.pag.cargando$;

  /** Sin `errorConf` un error falla hacia quien llama. Con él llega solo lo que se pida propagar: pedir el de red, o queda esperando (#390). */
  onBuscarPorId(id: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Mueble> {
    return this.genericService.onGetById(this.muebleByIdGQL, id, null, null, true, null, null, null, null, null, null,
      errorConf, contexto);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Mueble>> {
    return this.genericService.onCustomQuery(this.muebleSearchPageGQL, { texto, page, size });
  }

  /** Repite la página a la vista (después de guardar o borrar). */
  refrescar(): void {
    this.pag.recargar();
  }

  /** Un texto nuevo arranca en la página 1. */
  setSearchText(texto: string): void {
    this._searchText$.next(texto);
    this.pag.filtrar();
  }

  abrirFormulario(mueble?: Mueble): Observable<boolean | undefined> {
    return this.injector.get(MuebleDialogService).abrirFormulario(mueble);
  }

  /** Propaga el error de red: sin eso el genérico se lo traga y el formulario no se entera (#390). */
  onGuardar(input: MuebleInput): Observable<Mueble> {
    return this.genericService.onSave(this.saveMuebleGQL, input, undefined, undefined, true, PROPAGAR_ERROR_DE_RED).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteMuebleGQL,
      id,
      '¿Eliminar mueble?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este mueble?'
    ).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }

  abrirBuscadorFamilia(): Observable<FamiliaMueble | { adicionar: boolean } | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Familia de Mueble',
      query: this.familiaSearchPageGQL,
      tableData: tableData,
      inicialSearch: true,
      isAdicionar: true,
      isServidor: true,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed();
  }

  abrirBuscadorTipo(): Observable<TipoMueble | { adicionar: boolean } | undefined> {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID', width: '10%' },
      { id: 'descripcion', nombre: 'Descripción' }
    ];

    const data: SearchListtDialogData = {
      titulo: 'Buscar Tipo de Mueble',
      query: this.tipoMuebleSearchPageGQL,
      tableData: tableData,
      inicialSearch: true,
      isAdicionar: true,
      isServidor: true,
      paginator: true
    };

    return this.dialog.open(SearchListDialogComponent, {
      width: '600px',
      data: data
    }).afterClosed();
  }

  abrirAdicionarFamilia(): Observable<FamiliaMueble | undefined> {
    return this.dialog.open(AdicionarFamiliaMuebleDialogComponent, {
      width: '600px'
    }).afterClosed();
  }

  onGuardarFamilia(input: FamiliaMuebleInput): Observable<FamiliaMueble> {
    return this.genericService.onSave(this.saveFamiliaGQL, input);
  }

  onGuardarTipo(input: TipoMuebleInput): Observable<TipoMueble> {
    return this.genericService.onSave(this.saveTipoGQL, input);
  }

  onFiltrarFamilias(texto: string): Observable<FamiliaMueble[]> {
    return this.genericService.onGetByTexto(this.familiaSearchGQL, texto);
  }

  onFiltrarTipos(texto: string): Observable<TipoMueble[]> {
    return this.genericService.onGetByTexto(this.tipoMuebleSearchGQL, texto);
  }

  findByIdFamilia(id: number): Observable<FamiliaMueble> {
    return this.genericService.onGetById(this.familiaByIdGQL, id);
  }

  abrirAdicionarTipo(familiaId?: number): Observable<TipoMueble | undefined> {
    return this.dialog.open(AdicionarTipoMuebleDialogComponent, {
      width: '600px',
      data: { familiaId }
    }).afterClosed();
  }
}
