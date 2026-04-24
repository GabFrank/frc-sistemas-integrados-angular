import { Injectable } from '@angular/core';
import { AllFamiliasGQL } from './graphql/allFamilias';
import { BehaviorSubject, Observable } from 'rxjs';
import { Familia } from './familia.model';
import { FamiliaInput } from './graphql/familia-input.model';
import { SaveFamiliaGQL } from './graphql/saveFamilia';
import { DeleteFamiliaGQL } from './graphql/deleteFamilia';
import { CountFamiliaGQL } from './graphql/countFamilia';
import { MainService } from '../../../main.service';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { FamiliasSearchGQL } from './graphql/familiasSearch';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root',
})
export class FamiliaService {
  familias: Familia[];
  familiaBS = new BehaviorSubject<Familia[]>(null);

  constructor(
    private getFamilias: AllFamiliasGQL,
    private saveFamilia: SaveFamiliaGQL,
    private deleteFamilia: DeleteFamiliaGQL,
    private countFamilia: CountFamiliaGQL,
    public mainService: MainService, 
    private familiaSearch: FamiliasSearchGQL,
    private genericService: GenericCrudService
    ) {
    this.onGetFamilias()
  }

  onGetFamilias(servidor = true){
    return this.genericService.onCustomQuery(this.getFamilias, null, servidor).pipe(untilDestroyed(this)).subscribe(res => {
      if(res){
        this.familias = res;
        this.familiaBS.next(this.familias.sort((a,b)=>{
          if(a.id > b.id) {
            return 1
          } else {
            return -1
          }
        }))
      }
    })
  }

  onSearchFamilia(texto, page, size, servidor = true){
    return this.genericService.onCustomQuery(this.familiaSearch, {texto, page, size}, servidor);
  }

  onSaveFamilia(familiaInput: FamiliaInput, servidor = true): Observable<any>{
    return this.genericService.onSave(this.saveFamilia, familiaInput, null, null, servidor);  
  }



  onDeleteFamilia(id: number, servidor = true){
    return this.genericService.onDelete(this.deleteFamilia, id, null, null, servidor).pipe(untilDestroyed(this)).subscribe(res => {
      if(!res.errors){
        this.onGetFamilias()
      }
    })
  }

  onCountFamilia(servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(this.countFamilia, null, servidor);
  }

}
