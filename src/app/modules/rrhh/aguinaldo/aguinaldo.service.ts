import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AguinaldosPorAnioGQL } from './graphql/AguinaldosPorAnio';
import { CalcularAguinaldosAnioGQL } from './graphql/CalcularAguinaldosAnio';
import { AprobarAguinaldoGQL } from './graphql/AprobarAguinaldo';

@Injectable({ providedIn: 'root' })
export class AguinaldoService {
  constructor(
    private genericService: GenericCrudService,
    private aguinaldosPorAnioGQL: AguinaldosPorAnioGQL,
    private calcularAguinaldosAnioGQL: CalcularAguinaldosAnioGQL,
    private aprobarAguinaldoGQL: AprobarAguinaldoGQL
  ) { }

  onGetPorAnio(anio: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.aguinaldosPorAnioGQL, { anio }, servidor);
  }

  onCalcular(anio: number, servidor = true): Observable<number> {
    return this.genericService.onSaveCustom<number>(this.calcularAguinaldosAnioGQL, { anio }, servidor);
  }

  onAprobar(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarAguinaldoGQL, { id }, servidor);
  }
}
