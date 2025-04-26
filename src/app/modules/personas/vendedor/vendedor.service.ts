import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { VendedoresSearchByPersonaGQL } from './graphql/vendedorSearchByPersona';
import { Vendedor } from './vendedor.model';

@Injectable({
  providedIn: 'root'
})
export class VendedorService {

  constructor(
    private genericService: GenericCrudService,
    public vendedorSearch: VendedoresSearchByPersonaGQL
  ) { }

  onSearch(texto: string): Observable<Vendedor[]>{
    return this.genericService.onGetByTexto(this.vendedorSearch, texto);
  }
}
