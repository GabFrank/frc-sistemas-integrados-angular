import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { EnteByIdGQL } from '../graphql/enteById';
import { SaveEnteGQL } from '../graphql/saveEnte';
import { DeleteEnteGQL } from '../graphql/deleteEnte';
import { EnteSearchPageGQL } from '../graphql/enteSearchPage';
import { Ente } from '../models/ente.model';
import { EnteInput } from '../models/ente-input.model';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PageInfo } from '../../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class EnteService {
  private genericService = inject(GenericCrudService);
  private enteByIdGQL = inject(EnteByIdGQL);
  private saveEnteGQL = inject(SaveEnteGQL);
  private deleteEnteGQL = inject(DeleteEnteGQL);
  private enteSearchPageGQL = inject(EnteSearchPageGQL);

  private entesSubject = new BehaviorSubject<Ente[]>([]);
  private totalElementsSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private searchTextSubject = new BehaviorSubject<string>('');
  private paginationSubject = new BehaviorSubject({ pageIndex: 0, pageSize: 15 });

  public entes$ = this.entesSubject.asObservable();
  public totalElements$ = this.totalElementsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public paginationState$ = this.paginationSubject.asObservable();

  constructor() {
    combineLatest([
      this.searchTextSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.paginationSubject
    ]).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(([texto, pag]) => 
        this.genericService.onCustomQuery(this.enteSearchPageGQL, { texto, page: pag.pageIndex, size: pag.pageSize })
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
}
