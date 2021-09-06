import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MainService } from '../../../main.service';
import { FamiliaService } from '../familia/familia.service';
import { AllSubfamiliasGQL } from './graphql/allFamilias';
import { CountSubfamiliaGQL } from './graphql/countFamilia';
import { DeleteSubfamiliaGQL } from './graphql/deleteFamilia';
import { SaveSubfamiliaGQL } from './graphql/saveSubfamilia';
import { SubfamiliaInput } from './graphql/subfamilia-input.model';
import { Subfamilia } from './sub-familia.model';

@Injectable({
  providedIn: 'root'
})
export class SubFamiliaService {

  subfamilias: Subfamilia[];
  subfamiliaBS = new BehaviorSubject<Subfamilia[]>(null);

  constructor(
    private getSubfamilias: AllSubfamiliasGQL,
    private saveSubfamilia: SaveSubfamiliaGQL,
    private deleteSubfamilia: DeleteSubfamiliaGQL,
    private countSubfamilia: CountSubfamiliaGQL,
    public mainService: MainService,
    private familiaService: FamiliaService
    ) {
    this.onGetSubfamilias()
  }

  onGetSubfamilias(){
    this.getSubfamilias.fetch(null, {fetchPolicy: 'no-cache'}).subscribe(res => {
      if(!res.error){
        this.subfamilias = res.data.data;
        this.subfamiliaBS.next(this.subfamilias.sort((a,b)=>{
          if(a.id > b.id) {
            return 1
          } else {
            return -1
          }
        }))
      }
    })
  }

  onSaveSubfamilia(subfamiliaInput: SubfamiliaInput): Observable<any>{
    subfamiliaInput.usuarioId = this.mainService?.usuarioActual?.id
    subfamiliaInput.icono == null ? subfamiliaInput.icono = 'block' : null
    return new Observable((obs)=>{
      this.saveSubfamilia.mutate({
        entity: subfamiliaInput
      }).subscribe(res => {
        if(!res.errors){
          this.onGetSubfamilias()
          obs.next(res.data)
          this.familiaService.onGetFamilias()
        }
      })
    })
    
  }



  onDeleteSubfamilia(id: number){
    return this.deleteSubfamilia.mutate({
      id
    }).subscribe(res => {
      if(!res.errors){
        this.onGetSubfamilias()
        this.familiaService.onGetFamilias()
      }
    })
  }

  onCountSubfamilia(): Observable<number> {
    return new Observable((obs)=>{
      this.countSubfamilia.fetch().subscribe(res => {
        if(!res.error){
          return obs.next(res.data.countSubfamilia)
        }
      })
    }) 
  }
}
