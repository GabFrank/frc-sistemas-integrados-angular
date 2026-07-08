import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ValesPorFuncionarioGQL } from './graphql/ValesPorFuncionario';
import { ValesPorEstadoGQL } from './graphql/ValesPorEstado';
import { SaveValeGQL } from './graphql/SaveVale';
import { ConfirmarValeGQL } from './graphql/ConfirmarVale';
import { AnularValeGQL } from './graphql/AnularVale';
import { Vale } from './vale.model';

@Injectable({ providedIn: 'root' })
export class ValeService {

  constructor(
    private genericService: GenericCrudService,
    private valesPorFuncionarioGQL: ValesPorFuncionarioGQL,
    private valesPorEstadoGQL: ValesPorEstadoGQL,
    private saveValeGQL: SaveValeGQL,
    private confirmarValeGQL: ConfirmarValeGQL,
    private anularValeGQL: AnularValeGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valesPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  onGetPorEstado(estado: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valesPorEstadoGQL, { estado }, servidor);
  }

  onSave(input: any, servidor = true): Observable<Vale> {
    return this.genericService.onSave<Vale>(this.saveValeGQL, input, null, null, servidor);
  }

  onConfirmar(id: number, cajaVirtualId: number, autorizadoPorId: number, servidor = true): Observable<Vale> {
    return this.genericService.onSaveCustom<Vale>(this.confirmarValeGQL, { id, cajaVirtualId, autorizadoPorId }, servidor);
  }

  onAnular(id: number, servidor = true): Observable<Vale> {
    return this.genericService.onSaveCustom<Vale>(this.anularValeGQL, { id }, servidor);
  }
}
