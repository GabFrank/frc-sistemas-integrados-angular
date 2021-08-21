import { Injectable, Type } from '@angular/core';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { FuncionarioComponent } from './funcionario/funcionario.component';
import { TabService } from '../../../layouts/tab/tab.service';
import { Apollo } from 'apollo-angular';
import { funcionarioQuery, deleteFuncionarioQuery, funcionariosSearch, saveFuncionario } from './graphql/graphql-query';
import { ListFuncioarioComponent } from './list-funcioario/list-funcioario.component';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService extends GenericListService {

  constructor(
    apollo: Apollo,
    tabService: TabService,
    dialogoService: DialogosService
    ){
    super(apollo, tabService, dialogoService);
    this.entityQuery = funcionarioQuery;
    this.deleteQuery = deleteFuncionarioQuery;
    this.searchQuery = funcionariosSearch;
    this.saveQuery = saveFuncionario;
    this.editTitle = 'nombrePersona';
    this.deleteTitle = 'nombrePersona';
    this.newTitle = 'Nuevo Funcionario';
    this.component = FuncionarioComponent;
    this.parentComponent = ListFuncioarioComponent;
  }
}
