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
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { DeletePersonaGQL } from "./graphql/deletePersona";

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
    private getPersona: PersonaPorIdGQL,
    private genericService: GenericCrudService,
    private deletePersona: DeletePersonaGQL
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
    return this.genericService.onSave(this.savePersonna, input)
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

  onDeletePersona(id): Observable<boolean> {
    return this.genericService.onDelete(this.deletePersona, id)
  }

  onDeletePersonaSinDialogo(id): Observable<boolean> {
    return this.genericService.onDelete(this.deletePersona, id, null, null, false)
  }
}
