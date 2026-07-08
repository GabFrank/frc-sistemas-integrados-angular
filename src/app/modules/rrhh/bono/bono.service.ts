import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { BonosPorFuncionarioGQL } from './graphql/BonosPorFuncionario';
import { SaveBonoGQL } from './graphql/SaveBono';
import { AnularBonoGQL } from './graphql/AnularBono';
import { Bono } from './bono.model';

@Injectable({ providedIn: 'root' })
export class BonoService {
  constructor(
    private genericService: GenericCrudService,
    private bonosPorFuncionarioGQL: BonosPorFuncionarioGQL,
    private saveBonoGQL: SaveBonoGQL,
    private anularBonoGQL: AnularBonoGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.bonosPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  onSave(input: any, servidor = true): Observable<Bono> {
    return this.genericService.onSave<Bono>(this.saveBonoGQL, input, null, null, servidor);
  }

  onAnular(id: number, servidor = true): Observable<Bono> {
    return this.genericService.onSaveCustom<Bono>(this.anularBonoGQL, { id }, servidor);
  }
}
