import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { PageInfo } from '../../../app.component';
import { EntradaVaria, EntradaVariaCategoria } from './entrada-varia.model';
import { EntradasVariasGQL } from './graphql/entradasVarias';
import { EntradaVariaCategoriasGQL } from './graphql/entradaVariaCategorias';
import { RegistrarEntradaVariaGQL } from './graphql/registrarEntradaVaria';
import { AnularEntradaVariaGQL } from './graphql/anularEntradaVaria';

/** Listados y catálogos con un solo suscriptor por método, que maneja el error (#390). */
const CONSULTA_ENTRADAS: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

@Injectable({
  providedIn: 'root'
})
export class EntradaVariaService {

  constructor(
    private genericService: GenericCrudService,
    private entradasVariasGQL: EntradasVariasGQL,
    private categoriasGQL: EntradaVariaCategoriasGQL,
    private registrarGQL: RegistrarEntradaVariaGQL,
    private anularGQL: AnularEntradaVariaGQL,
  ) { }

  onGetEntradasVarias(cajaVirtualId: number, page = 0, size = 10): Observable<PageInfo<EntradaVaria>> {
    return this.genericService.onCustomQuery(this.entradasVariasGQL, { cajaVirtualId, page, size }, true,
      PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_ENTRADAS);
  }

  onGetCategorias(): Observable<EntradaVariaCategoria[]> {
    return this.genericService.onCustomQuery(this.categoriasGQL, {}, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_ENTRADAS);
  }

  onRegistrar(entradaVaria: EntradaVaria, opciones?: { avisarExito?: boolean }): Observable<EntradaVaria> {
    let aux = entradaVaria;
    if (!(entradaVaria instanceof EntradaVaria)) {
      aux = new EntradaVaria();
      Object.assign(aux, entradaVaria);
    }
    return this.genericService.onSaveCustom(this.registrarGQL, { input: aux.toInput() }, true, opciones);
  }

  onAnular(id: number, motivo?: string, opciones?: { avisarExito?: boolean }): Observable<EntradaVaria> {
    return this.genericService.onSaveCustom(this.anularGQL, { id, motivo: motivo?.toUpperCase() }, true, opciones);
  }
}
