import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MainService } from '../../../main.service';
import { FamiliaService } from '../familia/familia.service';
import { AllSubfamiliasGQL } from './graphql/allFamilias';
import { CountSubfamiliaGQL } from './graphql/countFamilia';
import { DeleteSubfamiliaGQL } from './graphql/deleteFamilia';
import { SaveSubfamiliaGQL } from './graphql/saveSubfamilia';
import { SubfamiliaInput } from './graphql/subfamilia-input.model';
import { Subfamilia } from './sub-familia.model';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SubfamiliasSearchGQL } from './graphql/subfamiliasSearch';
import { SearchSubfamiliaByDescripcionGQL } from './graphql/searchByDescripcion';

@UntilDestroy({ checkProperties: true })
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
    private familiaService: FamiliaService,
    private genericService: GenericCrudService,
    private subfamiliaSearch: SubfamiliasSearchGQL,
    private searchByDescripcion: SearchSubfamiliaByDescripcionGQL

  ) {
    this.onGetSubfamilias()
  }

  onGetSubfamilias(servidor = true) {
    return this.genericService.onCustomQuery(this.getSubfamilias, null, servidor).pipe(untilDestroyed(this)).subscribe(res => {
      if (!res.error) {
        this.subfamilias = res.data.data;
        this.subfamiliaBS.next(this.subfamilias.sort((a, b) => {
          if (a.id > b.id) {
            return 1
          } else {
            return -1
          }
        }))
      }
    })
  }

  onSaveSubfamilia(subfamiliaInput: SubfamiliaInput, servidor = true): Observable<any> {
    subfamiliaInput.usuarioId = this.mainService?.usuarioActual?.id
    subfamiliaInput.icono == null ? subfamiliaInput.icono = 'block' : null
    return new Observable(obs => {
      this.genericService.onSave(this.saveSubfamilia, subfamiliaInput, null, null, servidor).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.onGetSubfamilias()
          this.familiaService.onGetFamilias()
          obs.next(res)
        }
      })
    })
  }

  onSearchSubfamilia(familiaId, texto, page, size, servidor = true) {
    return this.genericService.onCustomQuery(this.subfamiliaSearch, { familiaId, texto, page, size }, servidor);
  }

  onSearchSubfamiliaSinFamiliaId(texto, page, size, servidor = true) {
    return this.genericService.onCustomQuery(this.subfamiliaSearch, { texto, page, size }, servidor);
  }



  onDeleteSubfamilia(id: number, servidor = true) {
    return this.genericService.onDelete(this.deleteSubfamilia, id, null, null, servidor).pipe(untilDestroyed(this)).subscribe(res => {
      if (!res.errors) {
        this.onGetSubfamilias()
        this.familiaService.onGetFamilias()
      }
    })
  }

  onCountSubfamilia(servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(this.countSubfamilia, null, servidor);
  }
}
