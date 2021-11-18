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
export class CiudadService {

  
}
