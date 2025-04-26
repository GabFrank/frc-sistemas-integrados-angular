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
  getAllCiudades(): Observable<Ciudad[]> {
    return new Observable((obs) => {
      this.ciudadesGQL
        .fetch(
          {},
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups! algo salio mal al cargar ciudades: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  /**
   * Busca ciudades por texto
   * @param texto Texto a buscar
   * @returns Observable con la lista de ciudades que coinciden
   */
  searchCiudades(texto: string): Observable<Ciudad[]> {
    return new Observable((obs) => {
      this.ciudadesSearchGQL
        .fetch(
          { texto: texto },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups! algo salio mal al buscar ciudades: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  /**
   * Obtiene una ciudad por su id
   * @param id ID de la ciudad
   * @returns Observable con la ciudad
   */
  getCiudadById(id: number): Observable<Ciudad> {
    return new Observable((obs) => {
      this.ciudadGQL
        .fetch(
          { id: id },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
            obs.complete();
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups! algo salio mal al obtener ciudad: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  /**
   * Guarda una ciudad
   * @param ciudad Ciudad a guardar
   * @returns Observable con la ciudad guardada
   */
  saveCiudad(ciudad: any): Observable<Ciudad> {
    return new Observable((obs) => {
      this.apollo.mutate({
        mutation: saveCiudad,
        variables: {
          entity: ciudad
        },
        fetchPolicy: "no-cache",
        errorPolicy: "all"
      })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: any) => {
          if (res.errors == null) {
            obs.next(res.data.data);
            obs.complete();
            this.notificacionBar.notification$.next({
              texto: "Ciudad guardada correctamente",
              color: NotificacionColor.success,
              duracion: 3
            });
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups! algo salio mal al guardar ciudad: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3
            });
          }
        },
        error: (err) => {
          this.notificacionBar.notification$.next({
            texto: "Ups! algo salio mal al guardar ciudad: " + err,
            color: NotificacionColor.danger,
            duracion: 3
          });
        }
      });
    });
  }
}
