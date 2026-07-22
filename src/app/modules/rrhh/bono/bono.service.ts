import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { BonosPorFuncionarioGQL } from './graphql/BonosPorFuncionario';
import { BonosPageGQL } from './graphql/BonosPage';
import { SaveBonoGQL } from './graphql/SaveBono';
import { AnularBonoGQL } from './graphql/AnularBono';
import { Bono } from './bono.model';

@Injectable({ providedIn: 'root' })
export class BonoService {
  constructor(
    private genericService: GenericCrudService,
    private bonosPorFuncionarioGQL: BonosPorFuncionarioGQL,
    private bonosPageGQL: BonosPageGQL,
    private saveBonoGQL: SaveBonoGQL,
    private anularBonoGQL: AnularBonoGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.bonosPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, tipo?: string,
            desde?: string, hasta?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.bonosPageGQL,
      { page, size, funcionarioId, tipo, desde, hasta }, servidor);
  }

  onSave(input: any, servidor = true): Observable<Bono> {
    return this.genericService.onSave<Bono>(this.saveBonoGQL, input, null, null, servidor);
  }

  onAnular(id: number, servidor = true): Observable<Bono> {
    return this.genericService.onSaveCustom<Bono>(this.anularBonoGQL, { id }, servidor);
  }
}
