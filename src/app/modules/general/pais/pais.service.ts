import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { deletePaisQuery, paisesSearch, paisQuery, savePais } from './graphql/graphql-query';
import { ListPaisComponent } from './list-pais/list-pais.component';
import { PaisComponent } from './pais/pais.component';

@Injectable({
  providedIn: 'root'
})
export class PaisService {

}
