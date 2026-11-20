import { Injectable, inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Inmueble } from '../models/inmueble.model';
import { InmuebleInput } from '../models/inmueble-input.model';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { InmuebleByIdGQL } from '../graphql/inmuebleById';
import { SaveInmuebleGQL } from '../graphql/saveInmueble';
import { DeleteInmuebleGQL } from '../graphql/deleteInmueble';
import { InmuebleSearchPageGQL } from '../graphql/inmuebleSearchPage';
import { MatDialog } from '@angular/material/dialog';
import { tap } from 'rxjs/operators';
import { InmuebleDialogService } from './inmueble-dialog-service.service';
import { InmuebleSearchGQL } from '../graphql/inmuebleSearch';
import { InmuebleSucursalDialogComponent, InmuebleSucursalDialogData } from '../dialogs/inmueble-sucursal-dialog/inmueble-sucursal-dialog.component';
import { EnteVinculacion } from '../../ente/models/ente-vinculacion.model';
import { DeleteEnteVinculacionGQL } from '../../ente/graphql/deleteEnteVinculacion';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InmuebleService {
  private genericService = inject(GenericCrudService);
  private inmuebleByIdGQL = inject(InmuebleByIdGQL);
  private saveInmuebleGQL = inject(SaveInmuebleGQL);
  private deleteInmuebleGQL = inject(DeleteInmuebleGQL);
  private inmuebleSearchGQL = inject(InmuebleSearchGQL);
  private inmuebleSearchPageGQL = inject(InmuebleSearchPageGQL);
  private deleteEnteVinculacionGQL = inject(DeleteEnteVinculacionGQL);
  private dialog = inject(MatDialog);
  private injector = inject(Injector);
  abrirFormulario(inmueble?: Inmueble): Observable<boolean | undefined> {
    return this.injector.get(InmuebleDialogService).abrirFormulario(inmueble);
  }

  abrirVinculacionSucursal(inmueble: Inmueble, vinculacion?: EnteVinculacion): Observable<EnteVinculacion | undefined> {
    return this.dialog.open(InmuebleSucursalDialogComponent, {
      data: { inmueble, vinculacion } as InmuebleSucursalDialogData,
      width: '620px',
      disableClose: true,
      autoFocus: false,
    }).afterClosed().pipe(
      tap((res) => {
        if (res) this.refrescar();
      }),
      map(res => res || undefined)
    );
  }

  onDesvincularSucursal(vinculacionId: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteEnteVinculacionGQL,
      vinculacionId,
      '¿Desvincular inmueble de sucursal?',
      null,
      true,
      true,
      '¿Está seguro que desea quitar la vinculación con la sucursal?'
    ).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }

  private _searchText$ = new BehaviorSubject<string>('');
  public searchText$ = this._searchText$.asObservable();


  /** Lista paginada en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  readonly pag = new PaginacionLista<Inmueble>({
    cargar: (page, size) => this.onFiltrar(this._searchText$.value, page, size),
    pageSize: 15,
  });
  public inmuebles$ = this.pag.items$;
  public loading$ = this.pag.cargando$;

  /** Sin `errorConf` un error falla hacia quien llama. Con él llega solo lo que se pida propagar: pedir el de red, o queda esperando (#390). */
  onBuscarPorId(id: number, errorConf?: QueryError, contexto?: ContextoConsulta): Observable<Inmueble> {
    return this.genericService.onGetById(this.inmuebleByIdGQL, id, null, null, true, null, null, null, null, null, null,
      errorConf, contexto);
  }

  onFiltrar(texto: string, page: number, size: number): Observable<PageInfo<Inmueble>> {
    return this.genericService.onCustomQuery(this.inmuebleSearchPageGQL, { texto, page, size });
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



  /** Propaga el error de red: sin eso el genérico se lo traga y el formulario no se entera (#390). */
  onGuardar(input: InmuebleInput): Observable<Inmueble> {
    return this.genericService.onSave(this.saveInmuebleGQL, input, undefined, undefined, true, PROPAGAR_ERROR_DE_RED).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteInmuebleGQL,
      id,
      '¿Eliminar inmueble?',
      null,
      true,
      true,
      '¿Está seguro que desea eliminar este inmueble?'
    ).pipe(
      tap((res) => {
        if (res) this.refrescar();
      })
    );
  }
}
