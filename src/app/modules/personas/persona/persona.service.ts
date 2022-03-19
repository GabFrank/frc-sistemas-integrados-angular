import { Injectable, Type } from "@angular/core";
import { PersonaSearchGQL } from "./graphql/personaSearch";
import { Observable } from "rxjs";
import { Persona } from "./persona.model";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { SavePersonaGQL } from "./graphql/savePersona";
import { MainService } from "../../../main.service";
import { PersonaInput } from "./persona/persona-input.model";
import { PersonaPorIdGQL } from "./graphql/personaPorId";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PersonaService {
  constructor(
    private searchPersona: PersonaSearchGQL,
    private notificacionBar: NotificacionSnackbarService,
    private savePersonna: SavePersonaGQL,
    private mainService: MainService,
    private getPersona: PersonaPorIdGQL
  ) {}

  onSearch(texto): Observable<Persona[]> {
    console.log("buscando ", texto);
    return new Observable((obs) => {
      this.searchPersona
        .fetch(
          {
            texto,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
          } else {
            this.notificacionBar.notification$.next({
              texto: `Ups! Algo salió mal. ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 4,
            });
          }
        });
    });
  }

  onSavePersona(input: PersonaInput): Observable<any> {
    return new Observable((obs) => {
      if (input.usuarioId == null) {
        input.usuarioId = this.mainService?.usuarioActual?.id;
      }
      this.savePersonna
        .mutate(
          {
            entity: input,
          },
          { errorPolicy: "all" }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res.errors);
          if (res.errors == null) {
            obs.next(res.data.data);
            this.notificacionBar.notification$.next({
              texto: "Producto guardado con éxito",
              color: NotificacionColor.success,
              duracion: 2,
            });
          } else {
            obs.next(null);
            this.notificacionBar.notification$.next({
              texto: `Ups! Algo salió mal. ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 4,
            });
          }
        });
    });
  }

  onGetPersona(id): Observable<Persona> {
    return new Observable((obs) => {
      this.getPersona
        .fetch(
          {
            id,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data.data);
          } else {
            this.notificacionBar.notification$.next({
              texto: `Ups! Algo salió mal. ${res.errors[0].message}`,
              color: NotificacionColor.danger,
              duracion: 4,
            });
            obs.next(null);
          }
        });
    });
  }
}
