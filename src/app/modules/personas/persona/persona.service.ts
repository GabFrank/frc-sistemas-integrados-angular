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
import { PersonaPorDocumentoGQL } from "./graphql/personaPorDocumento";

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
    private getPersonas: PersonasGQL,
    private personaPorDocumento: PersonaPorDocumentoGQL
  ) {}

  onGetAll(page, servidor: boolean = true): Observable<Persona[]>{
    return this.genericService.onGetAll(this.getPersonas, page, null, servidor)
  }

  onSearch(texto, servidor: boolean = true): Observable<Persona[]> {
    return this.genericService.onGetByTexto(this.searchPersona, texto, null, servidor)
  }

  onGetPorDocumento(texto, servidor: boolean = true): Observable<Persona> {
    return this.genericService.onCustomQuery(this.personaPorDocumento, {texto}, servidor)
  }

  onSavePersona(input: PersonaInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.savePersonna, input, null, null, servidor)
  }

  onGetPersona(id, servidor: boolean = true): Observable<Persona> {
    return this.genericService.onGetById(this.getPersona, id, null, null, servidor)
  }

  onDeletePersona(id, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deletePersona, id, "¿Eliminar persona?", null, true, servidor, "¿Está seguro que desea eliminar esta persona?");
  }

  onDeletePersonaSinDialogo(id, servidor: boolean = true): Observable<boolean> {
    return this.genericService.onDelete(this.deletePersona, id, null, null, false, servidor)
  }
}
