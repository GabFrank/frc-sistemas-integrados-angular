import { Injectable, Type } from '@angular/core';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { PersonaComponent } from './persona/persona.component';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { Apollo } from 'apollo-angular';
import { personaQuery, deletePersonaQuery, personasSearch, savePersona } from './graphql/graphql-query';
import { ListPersonaComponent } from './list-persona/list-persona.component';

@Injectable({
  providedIn: 'root'
})
export class PersonaService extends GenericListService {

  constructor(
    apollo: Apollo,
    tabService: TabService,
    dialogoService: DialogosService
    ){
    super(apollo, tabService, dialogoService);
    this.entityQuery = personaQuery;
    this.deleteQuery = deletePersonaQuery;
    this.searchQuery = personasSearch;
    this.saveQuery = savePersona;
    this.editTitle = 'nombre';
    this.deleteTitle = 'nombre';
    this.newTitle = 'Nueva Persona';
    this.component = PersonaComponent;
    this.parentComponent = ListPersonaComponent;
  }
}
