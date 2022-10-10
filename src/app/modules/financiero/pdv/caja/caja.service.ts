import { MainService } from './../../../../main.service';
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { CajaBalance, PdvCaja, PdvCajaInput } from "./caja.model";
import { CajaPorIdGQL } from "./graphql/cajaPorId";
import { CajaPorUsuarioIdAndAbiertoGQL } from "./graphql/cajaPorUsuarioIdAndAbierto";
import { CajasPorFechaGQL } from "./graphql/cajasPorFecha";
import { DeleteCajaGQL } from "./graphql/deleleCaja";
import { ImprimirBalanceGQL } from "./graphql/imprimirBalance";
import { SaveCajaGQL } from "./graphql/saveCaja";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BalancePorFechaGQL } from './graphql/balancePorFecha';
import { environment } from '../../../../../environments/environment';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CajaService {

  selectedCaja: PdvCaja;

  constructor(
    private genericService: GenericCrudService,
    private cajasPorFecha: CajasPorFechaGQL,
    private onSaveCaja: SaveCajaGQL,
    private cajaPorId: CajaPorIdGQL,
    private deleteCaja: DeleteCajaGQL,
    private cajaPorUsuarioIdAndAbierto: CajaPorUsuarioIdAndAbiertoGQL,
    private imprimirBalance: ImprimirBalanceGQL,
    private mainService: MainService,
    private balancePorFecha: BalancePorFechaGQL
  ) {
    
  }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllCajas);
  // }

  onGetByDate(inicio?: Date, fin?: Date, sucId?): Observable<PdvCaja[]> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date()
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date()
      fin = hoy;
    }
    return this.genericService.onGetByFecha(this.cajasPorFecha, inicio, fin, null, sucId);
  }

  onGetBalanceByDate(inicio?: Date, fin?: Date, sucId?): Observable<CajaBalance> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date()
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date()
      fin = hoy;
    }
    return this.genericService.onGetByFecha(this.balancePorFecha, inicio, fin, null, sucId);
  }

  onSave(input: PdvCajaInput): Observable<any> {
    return this.genericService.onSave(this.onSaveCaja, input);
  }

  onGetById(id, sucId?): Observable<any> {
    return this.genericService.onGetById(this.cajaPorId, id, null, null, null, sucId);
  }

  onGetByUsuarioIdAndAbierto(id, sucId?): Observable<any> {
    return this.genericService.onGetById(this.cajaPorUsuarioIdAndAbierto, id, null, null, null, sucId);
  }

  onDelete(id, showDialog?: boolean): Observable<any> {
    return this.genericService.onDelete(this.deleteCaja, id, showDialog);
  }

  onImprimirBalance(id, sucId?) {
    return this.imprimirBalance
      .fetch(
        {
          id,
          printerName: environment['printers']['ticket'],
          cajaName: environment['local'],
          sucId
        },
        {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        }
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
      });
  }
}
