import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { HorasExtraPorFuncionarioYRangoGQL } from './graphql/HorasExtraPorFuncionarioYRango';
import { SaveHoraExtraGQL } from './graphql/SaveHoraExtra';
import { AnularHoraExtraGQL } from './graphql/AnularHoraExtra';
import { HoraExtra } from './hora-extra.model';

@Injectable({ providedIn: 'root' })
export class HoraExtraService {

  constructor(
    private genericService: GenericCrudService,
    private horasExtraPorFuncionarioYRangoGQL: HorasExtraPorFuncionarioYRangoGQL,
    private saveHoraExtraGQL: SaveHoraExtraGQL,
    private anularHoraExtraGQL: AnularHoraExtraGQL
  ) { }

  onGetPorFuncionarioYRango(funcionarioId: number, desde: string, hasta: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(
      this.horasExtraPorFuncionarioYRangoGQL,
      { funcionarioId, desde, hasta },
      servidor
    );
  }

  onSave(input: any, servidor = true): Observable<HoraExtra> {
    return this.genericService.onSave<HoraExtra>(this.saveHoraExtraGQL, input, null, null, servidor);
  }

  onAnular(id: number, servidor = true): Observable<HoraExtra> {
    return this.genericService.onSaveCustom<HoraExtra>(this.anularHoraExtraGQL, { id }, servidor);
  }
}
