import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Barrio } from './barrio.model';
import { BarriosPorCiudadIdGQL } from './graphql/barriosPorCiudadId';

@Injectable({
  providedIn: 'root'
})
export class BarrioService {

  constructor(
    private genericService: GenericCrudService,
    private barrioPorCiudad: BarriosPorCiudadIdGQL
  ) { }

  onGetPorCiudadId(id): Observable<Barrio[]>{
    return this.genericService.onGetById(this.barrioPorCiudad, id);
  }
}
