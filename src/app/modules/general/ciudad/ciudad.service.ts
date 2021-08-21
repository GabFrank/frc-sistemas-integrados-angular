import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { ciudadQuery, deleteCiudadQuery, saveCiudad, ciudadesSearch } from '../ciudad/graphql/graphql-query';
import { ListCiudadComponent } from '../ciudad/list-ciudad/list-ciudad.component';
import { CiudadComponent } from '../ciudad/ciudad/ciudad.component';

@Injectable({
  providedIn: 'root'
})
export class CiudadService extends GenericListService {

  constructor(
    apollo: Apollo,
    tabService: TabService,
    dialogoService: DialogosService
    ){
    super(apollo, tabService, dialogoService);
    this.entityQuery = ciudadQuery;
    this.deleteQuery = deleteCiudadQuery;
    this.searchQuery = ciudadesSearch;
    this.saveQuery = saveCiudad;
    this.editTitle = 'nombre';
    this.deleteTitle = 'nombre';
    this.newTitle = 'Nueva Ciudad';
    this.component = CiudadComponent;
    this.parentComponent = ListCiudadComponent;
  }
}
