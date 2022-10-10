import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ProveedoresSearchByPersonaGQL } from './graphql/proveedorSearchByPersona';
import { SaveProveedorGQL } from './graphql/saveProveedor';
import { Proveedor } from './proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  constructor(
    private genericService: GenericCrudService,
    private proveedorSearch: ProveedoresSearchByPersonaGQL,
    private saveProveedor: SaveProveedorGQL
  ) { }

  onSearch(text: string): Observable<Proveedor[]> {
    return this.genericService.onGetByTexto(this.proveedorSearch, text)
  }

  onSave(input): Observable<Proveedor[]> {
    return this.genericService.onSave(this.saveProveedor, input)
  }
}
