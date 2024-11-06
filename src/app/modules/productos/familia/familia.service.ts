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

  onGetFamilias(){
    this.getFamilias.fetch(null, {fetchPolicy: 'no-cache'}).pipe(untilDestroyed(this)).subscribe(res => {
      if(!res.error){
        this.familias = res.data.data;
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

  onSearchFamilia(texto, page, size){
    return this.genericService.onCustomQuery(this.familiaSearch, {texto, page, size});
  }

  onSaveFamilia(familiaInput: FamiliaInput): Observable<any>{
    return this.genericService.onSave(this.saveFamilia, familiaInput);  
  }



  onDeleteFamilia(id: number){
    return this.deleteFamilia.mutate({
      id
    }).pipe(untilDestroyed(this)).subscribe(res => {
      if(!res.errors){
        this.onGetFamilias()
      }
    })
  }

  onCountFamilia(): Observable<number> {
    return new Observable((obs)=>{
      this.countFamilia.fetch().pipe(untilDestroyed(this)).subscribe(res => {
        if(!res.error){
          return obs.next(res.data.countFamilia)
        }
      })
    }) 
  }

}
