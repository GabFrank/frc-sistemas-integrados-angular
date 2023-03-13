import { Observable } from 'rxjs';
import { DeleteSectorGQL } from './graphql/deleteSector';
import { SaveSectorGQL } from './graphql/saveSector';
import { SectoresGQL } from './graphql/sectoresQuery';
import { SectorByIdGQL } from './graphql/sectorById';
import { onError } from '@apollo/client/link/error';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';
import { Sector } from './sector.model';

@Injectable({
  providedIn: 'root'
})
export class SectorService {

  constructor(
    private genericCrud: GenericCrudService, 
    private getSector: SectorByIdGQL,
    private getSectores: SectoresGQL,
    private saveSector: SaveSectorGQL,
    private deleteSector: DeleteSectorGQL,
    ) { }

  onGetSector(id): Observable<Sector>{
    return this.genericCrud.onGetById(this.getSector, id);
  }

  onGetSectores(id): Observable<Sector[]>{
    return this.genericCrud.onGetById(this.getSectores, id);
  }

  onSaveSector(input): Observable<Sector>{
    return this.genericCrud.onSave(this.saveSector, input);
  }

  onDeleteSector(id): Observable<boolean>{
    return this.genericCrud.onDelete(this.deleteSector, id)
  }
}
