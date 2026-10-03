import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { Banco } from './banco.model';
import { BancosGQL } from './graphql/bancos';
import { SaveBancoGQL } from './graphql/saveBanco';
import { DeleteBancoGQL } from './graphql/deleteBanco';

/** Listados y catálogos con un solo suscriptor por método, que maneja el error (#390). */
const CONSULTA_BANCOS: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

@Injectable({
  providedIn: 'root'
})
export class BancoService {

  constructor(
    private genericService: GenericCrudService,
    private bancosGQL: BancosGQL,
    private saveBancoGQL: SaveBancoGQL,
    private deleteBancoGQL: DeleteBancoGQL,
  ) { }

  onGetAll(page = 0, size = 100): Observable<Banco[]> {
    return this.genericService.onCustomQuery(this.bancosGQL, { page, size }, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_BANCOS);
  }

  onSave(banco: Banco, opciones?: { avisarExito?: boolean }): Observable<Banco> {
    let aux = banco;
    if (!(banco instanceof Banco)) {
      aux = new Banco();
      Object.assign(aux, banco);
    }
    return this.genericService.onSaveCustom(this.saveBancoGQL, { banco: aux.toInput() }, true, opciones);
  }

  onDelete(id: number, opciones?: { avisarExito?: boolean }): Observable<boolean> {
    return this.genericService.onSaveCustom(this.deleteBancoGQL, { id }, true, opciones);
  }
}
