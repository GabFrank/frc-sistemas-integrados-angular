import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PageInfo } from '../../../app.component';
import { EntradaVaria, EntradaVariaCategoria } from './entrada-varia.model';
import { EntradasVariasGQL } from './graphql/entradasVarias';
import { EntradaVariaCategoriasGQL } from './graphql/entradaVariaCategorias';
import { RegistrarEntradaVariaGQL } from './graphql/registrarEntradaVaria';
import { AnularEntradaVariaGQL } from './graphql/anularEntradaVaria';

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
    return this.genericService.onCustomQuery(this.entradasVariasGQL, { cajaVirtualId, page, size });
  }

  onGetCategorias(): Observable<EntradaVariaCategoria[]> {
    return this.genericService.onCustomQuery(this.categoriasGQL, {});
  }

  onRegistrar(entradaVaria: EntradaVaria): Observable<EntradaVaria> {
    let aux = entradaVaria;
    if (!(entradaVaria instanceof EntradaVaria)) {
      aux = new EntradaVaria();
      Object.assign(aux, entradaVaria);
    }
    return this.genericService.onSaveCustom(this.registrarGQL, { input: aux.toInput() });
  }

  onAnular(id: number, motivo?: string): Observable<EntradaVaria> {
    return this.genericService.onSaveCustom(this.anularGQL, { id, motivo: motivo?.toUpperCase() });
  }
}
