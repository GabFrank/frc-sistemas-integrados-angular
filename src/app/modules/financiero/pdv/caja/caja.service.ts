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
import { CajaAbiertoPorSucursalGQL } from "./graphql/cajaAbiertoPorSucursal";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";

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
    private verificarCaja: VerificarCajaGQL,
    private cajaAbiertoPorSucursal: CajaAbiertoPorSucursalGQL,
    private configService: ConfiguracionService
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllCajas);
  // }

  onCajaBalancePorId(id: number, servidor: boolean = true): Observable<CajaBalance> {
    return this.genericService.onGetById(this.balancePorCajaId, id, null, null, servidor);
  }

  onCajaBalancePorIdAndSucursalId(id: number, sucId: number, servidor: boolean = true): Observable<CajaBalance> {
    return this.genericService.onCustomQuery(this.balancePorCajaIdAndSucursalId, { id, sucId }, servidor, null, true);
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
    size: number,
    servidor: boolean = true
  ) {
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
    }, servidor);
  }

  onGetByDate(inicio?: Date, fin?: Date, sucId?, servidor: boolean = true): Observable<PdvCaja[]> {
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
      servidor,
      sucId
    );
  }

  onGetBalanceByDate(
    inicio?: Date,
    fin?: Date,
    sucId?,
    servidor: boolean = true
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
      servidor,
      sucId
    );
  }

  onSave(input: PdvCajaInput, servidor: boolean = true): Observable<any> {
    return this.genericService.onSave(this.onSaveCaja, input, null, null, servidor);
  }

  onGetById(id, sucId?, silentLoad?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(
      this.cajaPorId,
      id,
      null,
      null,
      servidor,
      sucId,
      null
    );
  }

  onGetByIdSimp(id, sucId?, silentLoad?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(
      this.cajaSimplePorId,
      id,
      null,
      null,
      servidor,
      sucId,
      null
    );
  }

  onGetByUsuarioIdAndAbierto(id, sucId?, servidor: boolean = true): Observable<any> {
    return this.genericService.onGetById(
      this.cajaPorUsuarioIdAndAbierto,
      id,
      null,
      null, servidor,
      sucId
    );
  }

  onDelete(id, showDialog?: boolean, servidor: boolean = true): Observable<any> {
    return this.genericService.onDelete(this.deleteCaja, id, "¿Eliminar caja?", null, showDialog, servidor, "¿Está seguro que desea eliminar esta caja?");
  }

  onImprimirBalance(id, sucId?, servidor: boolean = true) {
    return this.genericService.onCustomQuery(this.imprimirBalance, {id, printerName: this.configService.getConfig().printers["ticket"], cajaName: this.configService.getConfig().local, sucId}, servidor, null, true);
  }

  onVerificarCaja(cajaId, sucursalId, usuarioId, verificado, servidor: boolean = true) {
    return this.genericService.onCustomQuery(this.verificarCaja, { cajaId, sucursalId, usuarioId, verificado }, servidor)
  }

  /**
   * Obtiene las cajas abiertas de una sucursal con sus balances
   * @param sucursalId ID de la sucursal
   * @returns Observable con un array de cajas abiertas con sus balances
   */
  onGetCajasAbiertasPorSucursal(sucursalId: number, servidor: boolean = true): Observable<PdvCaja[]> {
    return this.genericService.onCustomQuery(
      this.cajaAbiertoPorSucursal,
      { sucursalId },
      servidor,
      null,
      true
    );
  }
}
