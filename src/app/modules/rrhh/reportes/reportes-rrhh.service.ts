import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ReporteNominaMesGQL } from './graphql/ReporteNominaMes';
import { ReporteResumenIpsGQL } from './graphql/ReporteResumenIps';
import { ReporteValesPendientesGQL } from './graphql/ReporteValesPendientes';
import { ReportePrestamosActivosGQL } from './graphql/ReportePrestamosActivos';
import { ReporteAguinaldoAnualGQL } from './graphql/ReporteAguinaldoAnual';
import {
  ImprimirReciboAguinaldoGQL,
  ImprimirReciboBonoGQL,
  ImprimirReciboPenalizacionGQL,
  ImprimirReciboPrestamoGQL,
  ImprimirReciboValeGQL,
} from './graphql/RecibosRrhh';

@Injectable({ providedIn: 'root' })
export class ReportesRrhhService {

  constructor(
    private genericService: GenericCrudService,
    private nominaGQL: ReporteNominaMesGQL,
    private ipsGQL: ReporteResumenIpsGQL,
    private valesGQL: ReporteValesPendientesGQL,
    private prestamosGQL: ReportePrestamosActivosGQL,
    private aguinaldoGQL: ReporteAguinaldoAnualGQL,
    private reciboValeGQL: ImprimirReciboValeGQL,
    private reciboPenalizacionGQL: ImprimirReciboPenalizacionGQL,
    private reciboAguinaldoGQL: ImprimirReciboAguinaldoGQL,
    private reciboPrestamoGQL: ImprimirReciboPrestamoGQL,
    private reciboBonoGQL: ImprimirReciboBonoGQL
  ) { }

  onReciboVale(id: number, anchoMm: number | null = null, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.reciboValeGQL, { id, anchoMm }, servidor);
  }

  onReciboPenalizacion(id: number, anchoMm: number | null = null, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.reciboPenalizacionGQL, { id, anchoMm }, servidor);
  }

  onReciboAguinaldo(id: number, anchoMm: number | null = null, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.reciboAguinaldoGQL, { id, anchoMm }, servidor);
  }

  onReciboPrestamo(id: number, anchoMm: number | null = null, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.reciboPrestamoGQL, { id, anchoMm }, servidor);
  }

  onReciboBono(id: number, anchoMm: number | null = null, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.reciboBonoGQL, { id, anchoMm }, servidor);
  }

  onNominaMes(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.nominaGQL, { periodo }, servidor);
  }

  onResumenIps(periodo: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.ipsGQL, { periodo }, servidor);
  }

  onValesPendientes(servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valesGQL, {}, servidor);
  }

  onPrestamosActivos(servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.prestamosGQL, {}, servidor);
  }

  onAguinaldoAnual(anio: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.aguinaldoGQL, { anio }, servidor);
  }
}
