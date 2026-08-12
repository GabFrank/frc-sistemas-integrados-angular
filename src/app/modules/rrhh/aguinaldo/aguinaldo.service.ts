import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AguinaldosPorAnioGQL } from './graphql/AguinaldosPorAnio';
import { AguinaldosPageGQL } from './graphql/AguinaldosPage';
import { CalcularAguinaldosAnioGQL } from './graphql/CalcularAguinaldosAnio';
import { AprobarAguinaldoGQL } from './graphql/AprobarAguinaldo';
import { PagarAguinaldoGQL } from './graphql/PagarAguinaldo';

@Injectable({ providedIn: 'root' })
export class AguinaldoService {
  constructor(
    private genericService: GenericCrudService,
    private aguinaldosPorAnioGQL: AguinaldosPorAnioGQL,
    private aguinaldosPageGQL: AguinaldosPageGQL,
    private calcularAguinaldosAnioGQL: CalcularAguinaldosAnioGQL,
    private aprobarAguinaldoGQL: AprobarAguinaldoGQL,
    private pagarAguinaldoGQL: PagarAguinaldoGQL
  ) { }

  onGetPorAnio(anio: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.aguinaldosPorAnioGQL, { anio }, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, anio?: number, funcionarioId?: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.aguinaldosPageGQL, { page, size, anio, funcionarioId }, servidor);
  }

  onCalcular(anio: number, servidor = true): Observable<number> {
    return this.genericService.onSaveCustom<number>(this.calcularAguinaldosAnioGQL, { anio }, servidor);
  }

  onAprobar(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarAguinaldoGQL, { id }, servidor);
  }

  onPagar(id: number, cajaVirtualId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.pagarAguinaldoGQL, { id, cajaVirtualId }, servidor);
  }
}
