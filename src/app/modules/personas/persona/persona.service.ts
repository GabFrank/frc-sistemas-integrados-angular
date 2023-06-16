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
import { PersonasGQL } from "./graphql/personasQuery";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PersonaService {
  constructor(
    private searchPersona: PersonaSearchGQL,
    private notificacionBar: NotificacionSnackbarService,
    private savePersonna: SavePersonaGQL,
    private getPersona: PersonaPorIdGQL,
    private genericService: GenericCrudService,
    private deletePersona: DeletePersonaGQL,
    private getPersonas: PersonasGQL
  ) {}

  onGetAll(page): Observable<Persona[]>{
    return this.genericService.onGetAll(this.getPersonas, page)
  }

  onSearch(texto): Observable<Persona[]> {
    return this.genericService.onGetByTexto(this.searchPersona, texto)
  }

  onSavePersona(input: PersonaInput): Observable<any> {
    return this.genericService.onSave(this.savePersonna, input, null, null, true)
  }

  onGetPersona(id): Observable<Persona> {
    return this.genericService.onGetById(this.getPersona, id)
  }

  onDeletePersona(id): Observable<boolean> {
    return this.genericService.onDelete(this.deletePersona, id)
  }

  onDeletePersonaSinDialogo(id): Observable<boolean> {
    return this.genericService.onDelete(this.deletePersona, id, null, null, false)
  }
}
