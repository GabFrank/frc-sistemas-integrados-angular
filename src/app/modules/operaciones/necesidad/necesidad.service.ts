import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { EditNecesidadComponent } from './edit-necesidad/edit-necesidad.component';
import { necesidadQuery, deleteNecesidadQuery, saveNecesidad, necesidadesSearch, necesidadesQuery, necesidadesPorFechaQuery } from './graphql/graphql-query';
import { ListNecesidadComponent } from './list-necesidad/list-necesidad.component';

@Injectable({
  providedIn: 'root'
})
export class NecesidadService extends GenericListService {

  constructor(
    apollo: Apollo,
    tabService: TabService,
    dialogoService: DialogosService
    ){
    super(apollo, tabService, dialogoService);
    this.entityQuery = necesidadQuery;
    this.deleteQuery = deleteNecesidadQuery;
    this.searchQuery = necesidadesSearch;
    this.allEntitiesQuery = necesidadesQuery;
    this.dataRangeQuery = necesidadesPorFechaQuery;
    this.saveQuery = saveNecesidad;
    this.preTitle = 'Necesidad';
    this.editTitle = 'id';
    this.deleteTitle = 'id';
    this.newTitle = 'Nueva Necesidad';
    this.component = EditNecesidadComponent;
    this.parentComponent = ListNecesidadComponent;
    this.isDateSort = true;
  }
}
