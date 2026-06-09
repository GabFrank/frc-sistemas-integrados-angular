import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { EnteArchivo } from '../models/ente-archivo.model';
import { EnteArchivoInput } from '../models/ente-archivo-input.model';
import { EnteArchivosByEnteGQL } from '../graphql/enteArchivosByEnte';
import { GetEnteArchivoContenidoGQL } from '../graphql/getEnteArchivoContenido';
import { SaveEnteArchivoGQL } from '../graphql/saveEnteArchivo';

@Injectable({ providedIn: 'root' })
export class EnteArchivoService {
  private generic = inject(GenericCrudService);
  private listarGQL = inject(EnteArchivosByEnteGQL);
  private contenidoGQL = inject(GetEnteArchivoContenidoGQL);
  private guardarGQL = inject(SaveEnteArchivoGQL);

  listarPorEnte(enteId: number): Observable<EnteArchivo[]> {
    return this.generic.onCustomQuery(this.listarGQL, { enteId }).pipe(
      map((res: EnteArchivo[] | null) => res || [])
    );
  }

  guardar(input: EnteArchivoInput): Observable<EnteArchivo> {
    return this.generic.onSave(this.guardarGQL, input);
  }

  obtenerContenido(id: number): Observable<string[]> {
    return this.generic.onCustomQuery(this.contenidoGQL, { id }, true, null, true).pipe(
      map((res: string[] | null) => res || [])
    );
  }
}
