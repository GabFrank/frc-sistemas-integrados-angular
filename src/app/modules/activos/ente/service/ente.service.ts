import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { EnteByIdGQL } from '../graphql/enteById';
import { SaveEnteGQL } from '../graphql/saveEnte';
import { DeleteEnteGQL } from '../graphql/deleteEnte';
import { EnteSearchPageGQL } from '../graphql/enteSearchPage';
import { SaveEnteSucursalGQL } from '../graphql/saveEnteSucursal';
import { DeleteEnteSucursalGQL } from '../graphql/deleteEnteSucursal';
import { EntesSucursalesByEnteIdGQL } from '../graphql/entesSucursalesByEnteId';
import { EnteByReferenciaIdGQL } from '../graphql/enteByReferenciaId';
import { Ente } from '../models/ente.model';
import { TipoEnte } from '../enums/tipo-ente.enum';
import { EnteSucursal } from '../models/ente-sucursal.model';
import { EnteInput } from '../models/ente-input.model';
import { EnteSucursalInput } from '../models/ente-sucursal-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EnteService {
  private genericService = inject(GenericCrudService);
  private enteByIdGQL = inject(EnteByIdGQL);
  private saveEnteGQL = inject(SaveEnteGQL);
  private deleteEnteGQL = inject(DeleteEnteGQL);
  private enteSearchPageGQL = inject(EnteSearchPageGQL);
  private saveEnteSucursalGQL = inject(SaveEnteSucursalGQL);
  private deleteEnteSucursalGQL = inject(DeleteEnteSucursalGQL);
  private entesSucursalesByEnteIdGQL = inject(EntesSucursalesByEnteIdGQL);
  private enteByReferenciaIdGQL = inject(EnteByReferenciaIdGQL);

  private entesSubject = new BehaviorSubject<Ente[]>([]);
  private totalElementsSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private searchTextSubject = new BehaviorSubject<string>('');
  private sucursalIdSubject = new BehaviorSubject<number | null>(null);
  private paginationSubject = new BehaviorSubject({ pageIndex: 0, pageSize: 15 });

  public entes$ = this.entesSubject.asObservable();
  public totalElements$ = this.totalElementsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public paginationState$ = this.paginationSubject.asObservable();
  public sucursalId$ = this.sucursalIdSubject.asObservable();

  constructor() {
    combineLatest([
      this.searchTextSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.sucursalIdSubject,
      this.paginationSubject
    ]).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(([texto, sucursalId, pag]) =>
        this.genericService.onCustomQuery(this.enteSearchPageGQL, { texto, sucursalId, page: pag.pageIndex, size: pag.pageSize })
      )
    ).subscribe((res: PageInfo<Ente>) => {
      this.entesSubject.next(res.getContent);
      this.totalElementsSubject.next(res.getTotalElements);
      this.loadingSubject.next(false);
    });
  }

  refrescar(): void {
    this.paginationSubject.next({ ...this.paginationSubject.value });
  }

  setSearchText(texto: string): void {
    this.searchTextSubject.next(texto);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  setSucursalId(id: number | null): void {
    this.sucursalIdSubject.next(id);
    this.paginationSubject.next({ ...this.paginationSubject.value, pageIndex: 0 });
  }

  updatePagination(pageIndex: number, pageSize: number): void {
    this.paginationSubject.next({ pageIndex, pageSize });
  }

  onBuscarPorId(id: number): Observable<Ente> {
    return this.genericService.onGetById(this.enteByIdGQL, id);
  }

  onGuardar(input: EnteInput): Observable<Ente> {
    return this.genericService.onSave(this.saveEnteGQL, input);
  }

  onEliminar(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEnteGQL, id, '¿Eliminar ente?');
  }

  onGetByReferenciaId(tipoEnte: TipoEnte, referenciaId: number): Observable<Ente> {
    return this.genericService.onCustomQuery(this.enteByReferenciaIdGQL, { tipoEnte, referenciaId });
  }

  onBuscarPagina(texto: string, sucursalId: number | null, page: number, size: number): Observable<PageInfo<Ente>> {
    return this.genericService.onCustomQuery(this.enteSearchPageGQL, { texto, sucursalId, page, size });
  }

  getEnteSucursalByEnteId(enteId: number): Observable<EnteSucursal[]> {
    return this.genericService.onCustomQuery(this.entesSucursalesByEnteIdGQL, { enteId });
  }

  getEnteSucursalByEnteAndSucursal(enteId: number, sucursalId: number): Observable<EnteSucursal | null> {
    return this.genericService.onCustomQuery(this.entesSucursalesByEnteIdGQL, { enteId }).pipe(
      map(res => {
        const assignments = res as EnteSucursal[];
        return assignments.find(a => a.sucursal.id == sucursalId) || null;
      })
    );
  }

  onGuardarEnteSucursal(input: EnteSucursalInput): Observable<EnteSucursal> {
    return this.genericService.onSave(this.saveEnteSucursalGQL, input);
  }

  onEliminarEnteSucursal(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteEnteSucursalGQL, id, '¿Desvincular de la sucursal?', null, true, true, '¿Está seguro que desea retirar este bien de la sucursal?');
  }
}
