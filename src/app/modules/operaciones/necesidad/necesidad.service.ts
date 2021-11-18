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
export class NecesidadService {

}
