import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { ciudadQuery, deleteCiudadQuery, saveCiudad, ciudadesSearch, ciudadesQuery } from './graphql/graphql-query';
import { ListCiudadComponent } from './list-ciudad/list-ciudad.component';
import { CiudadComponent } from './ciudad/ciudad.component';
import { Observable } from 'rxjs';
import { Ciudad } from './ciudad.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { CiudadesGQL } from './graphql/ciudadesQuery';
import { CiudadGQL } from './graphql/ciudadQuery';
import { CiudadesSearchGQL } from './graphql/ciudadesSearchGQL';
import { GenericCrudService } from '../../../generics/generic-crud.service';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class CiudadService {
  constructor(
    private apollo: Apollo,
    private tabService: TabService,
    private dialogosService: DialogosService,
    private notificacionBar: NotificacionSnackbarService,
    private ciudadesGQL: CiudadesGQL,
    private ciudadGQL: CiudadGQL,
    private ciudadesSearchGQL: CiudadesSearchGQL,
    private genericService: GenericCrudService
  ) {}

  /**
   * Obtiene todas las ciudades desde el backend
   * @returns Observable con la lista de ciudades
   */
  getAllCiudades(servidor = true): Observable<Ciudad[]> {
    // refactorizar usando el servicio de generic-crud
    return this.genericService.onCustomQuery(this.ciudadesGQL, null, servidor);
  }

  /**
   * Busca ciudades por texto
   * @param texto Texto a buscar
   * @returns Observable con la lista de ciudades que coinciden
   */
  searchCiudades(texto: string, servidor = true): Observable<Ciudad[]> {
    return this.genericService.onCustomQuery(this.ciudadesSearchGQL, { texto }, servidor);
  }

  /**
   * Obtiene una ciudad por su id
   * @param id ID de la ciudad
   * @returns Observable con la ciudad
   */
  getCiudadById(id: number, servidor = true): Observable<Ciudad> {
    return this.genericService.onCustomQuery(this.ciudadGQL, { id }, servidor);
  }

  /**
   * Guarda una ciudad
   * @param ciudad Ciudad a guardar
   * @returns Observable con la ciudad guardada
   */
//   saveCiudad(ciudad: any, servidor = true): Observable<Ciudad> {
//     return this.genericService.onSave(saveCiudad, { entity: ciudad }, servidor);
//   }
}
