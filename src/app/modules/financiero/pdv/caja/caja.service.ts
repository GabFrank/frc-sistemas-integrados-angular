import { MainService } from "./../../../../main.service";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import {
  CajaBalance,
  PdvCaja,
  PdvCajaEstado,
  PdvCajaInput,
} from "./caja.model";
import { CajaPorIdGQL } from "./graphql/cajaPorId";
import { CajaPorUsuarioIdAndAbiertoGQL } from "./graphql/cajaPorUsuarioIdAndAbierto";
import { CajasPorFechaGQL } from "./graphql/cajasPorFecha";
import { DeleteCajaGQL } from "./graphql/deleleCaja";
import { ImprimirBalanceGQL } from "./graphql/imprimirBalance";
import { SaveCajaGQL } from "./graphql/saveCaja";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BalancePorFechaGQL } from "./graphql/balancePorFecha";
import { environment } from "../../../../../environments/environment";
import { BalancePorCajaIdGQL } from "./graphql/imprimirBalance copy";
import { CajasWithFiltersGQL } from "./graphql/cajaWithFilters";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { BalancePorCajaIdAndSucursalIdGQL } from "./graphql/balancePorCajaIdAndSucursalId";
import { CajaSimplePorIdGQL } from "./graphql/cajaSimplePorId";
import { VerificarCajaGQL } from "./graphql/verificarCaja";

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
    private cajaSimplePorId: CajaSimplePorIdGQL,
    private deleteCaja: DeleteCajaGQL,
    private cajaPorUsuarioIdAndAbierto: CajaPorUsuarioIdAndAbiertoGQL,
    private imprimirBalance: ImprimirBalanceGQL,
    private mainService: MainService,
    private balancePorFecha: BalancePorFechaGQL,
    private balancePorCajaId: BalancePorCajaIdGQL,
    private cajasWithFilters: CajasWithFiltersGQL,
    private balancePorCajaIdAndSucursalId: BalancePorCajaIdAndSucursalIdGQL,
    private verificarCaja: VerificarCajaGQL
  ) {}

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllCajas);
  // }

  onCajaBalancePorId(id: number): Observable<CajaBalance> {
    return this.genericService.onGetById(this.balancePorCajaId, id);
  }

  onCajaBalancePorIdAndSucursalId(id: number, sucId: number): Observable<CajaBalance> {
    return this.genericService.onCustomQuery(this.balancePorCajaIdAndSucursalId, {id, sucId}, null, null, true);
  }

  onGetCajasWithFilters(
    cajaId: number,
    estado: PdvCajaEstado,
    maletinId: number,
    cajeroId: number,
    fechaInicio: Date,
    fechaFin: Date,
    sucId: number,
    verificado: boolean,
    page: number,
    size: number
  ){
    return this.genericService.onCustomQuery(this.cajasWithFilters, {
      cajaId,
      estado,
      maletinId,
      cajeroId,
      fechaInicio: dateToString(fechaInicio),
      fechaFin: dateToString(fechaFin),
      sucId,
      verificado,
      page,
      size
    });
  }

  onGetByDate(inicio?: Date, fin?: Date, sucId?): Observable<PdvCaja[]> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date();
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date();
      fin = hoy;
    }
    return this.genericService.onGetByFecha(
      this.cajasPorFecha,
      inicio,
      fin,
      null,
      sucId
    );
  }

  onGetBalanceByDate(
    inicio?: Date,
    fin?: Date,
    sucId?
  ): Observable<CajaBalance> {
    let hoy = new Date();
    if (inicio == null) {
      inicio = new Date();
      inicio.setDate(hoy.getDate() - 2);
    }
    if (fin == null) {
      fin = new Date();
      fin = hoy;
    }
    return this.genericService.onGetByFecha(
      this.balancePorFecha,
      inicio,
      fin,
      null,
      sucId
    );
  }

  onSave(input: PdvCajaInput): Observable<any> {
    return this.genericService.onSave(this.onSaveCaja, input);
  }

  onGetById(id, sucId?, silentLoad?): Observable<any> {
    return this.genericService.onGetById(
      this.cajaPorId,
      id,
      null,
      null,
      null,
      sucId,
      null
    );
  }

  onGetByIdSimp(id, sucId?, silentLoad?): Observable<any> {
    return this.genericService.onGetById(
      this.cajaSimplePorId,
      id,
      null,
      null,
      null,
      sucId,
      null
    );
  }

  onGetByUsuarioIdAndAbierto(id, sucId?): Observable<any> {
    return this.genericService.onGetById(
      this.cajaPorUsuarioIdAndAbierto,
      id,
      null,
      null,
      null,
      sucId
    );
  }

  onDelete(id, showDialog?: boolean): Observable<any> {
    return this.genericService.onDelete(this.deleteCaja, id, showDialog);
  }

  onImprimirBalance(id, sucId?) {
    return this.imprimirBalance
      .fetch(
        {
          id,
          printerName: environment["printers"]["ticket"],
          cajaName: environment["local"],
          sucId,
        },
        {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        }
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {});
  }

  onVerificarCaja(cajaId, sucursalId, usuarioId, verificado){
    return this.genericService.onCustomQuery(this.verificarCaja, {cajaId, sucursalId, usuarioId, verificado})
  }
}
