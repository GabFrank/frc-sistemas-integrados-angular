import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';

import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { MainService } from '../../../../main.service';

import { Marcacion, MarcacionInput } from '../models/marcacion.model';
import { Jornada } from '../models/jornada.model';
import { TipoMarcacion } from '../enums/tipo-marcacion.enum';

import { GetMarcacionGQL } from '../graphql/getMarcacion';
import { GetMarcacionesGQL } from '../graphql/getMarcaciones';
import { GetMarcacionesPorUsuarioGQL } from '../graphql/getMarcacionesPorUsuario';
import { SaveMarcacionGQL } from '../graphql/saveMarcacion';
import { DeleteMarcacionGQL } from '../graphql/deleteMarcacion';
import { GetJornadaGQL } from '../graphql/getJornada';
import { GetJornadasGQL } from '../graphql/getJornadas';
import { GetJornadasPorUsuarioGQL } from '../graphql/getJornadasPorUsuario';
import { ImprimirReporteMarcacionesGQL } from '../graphql/imprimirReporteMarcaciones';
import { ReporteService } from '../../../reportes/reporte.service';
import { TabService } from '../../../../layouts/tab/tab.service';
import { Tab } from '../../../../layouts/tab/tab.model';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { ListMarcacionComponent } from '../components/list-marcacion/list-marcacion.component';

export interface MarcacionContexto {
  usuarioId?: number;
  sucursalId: number;
  latitud?: number;
  longitud?: number;
  precisionGps?: number;
  distanciaSucursalMetros?: number;
  deviceId?: string;
  deviceInfo?: string;
  embedding?: number[];
}

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class MarcacionService {

  constructor(
    private genericCrudService: GenericCrudService,
    private mainService: MainService,
    private getMarcacion: GetMarcacionGQL,
    private getMarcaciones: GetMarcacionesGQL,
    private getMarcacionesPorUsuario: GetMarcacionesPorUsuarioGQL,
    private saveMarcacion: SaveMarcacionGQL,
    private deleteMarcacion: DeleteMarcacionGQL,
    private getJornada: GetJornadaGQL,
    private getJornadas: GetJornadasGQL,
    private getJornadasPorUsuario: GetJornadasPorUsuarioGQL,
    private imprimirReporteMarcaciones: ImprimirReporteMarcacionesGQL,
    private reporteService: ReporteService,
    private tabService: TabService
  ) { }

  onGetMarcacion(id: number, servidor = true): Observable<Marcacion> {
    return this.genericCrudService.onGetById(this.getMarcacion, id, null, null, servidor);
  }

  onGetMarcaciones(page?: number, size?: number, servidor = true): Observable<Marcacion[]> {
    return this.genericCrudService.onGetAll(this.getMarcaciones, page, size, servidor);
  }

  onGetMarcacionesPorUsuario(usuarioId: number, fechaInicio?: string, fechaFin?: string, page?: number, size?: number, servidor = true, errorConf?: any): Observable<Marcacion[]> {
    return this.genericCrudService.onCustomQuery(
      this.getMarcacionesPorUsuario,
      { usuarioId, fechaInicio, fechaFin, page, size },
      servidor,
      errorConf
    );
  }

  onSaveMarcacion(input: MarcacionInput, servidor = true, errorConf?: any): Observable<Marcacion> {
    if (!input.usuarioId) {
      input.usuarioId = this.mainService.usuarioActual?.id;
    }
    return this.genericCrudService.onSave(this.saveMarcacion, input, null, null, servidor, errorConf);
  }

  onGetJornada(id: number, servidor = true): Observable<Jornada> {
    return this.genericCrudService.onGetById(this.getJornada, id, null, null, servidor);
  }

  onGetJornadas(page?: number, size?: number, servidor = true): Observable<Jornada[]> {
    return this.genericCrudService.onGetAll(this.getJornadas, page, size, servidor);
  }

  onGetJornadasPorUsuario(usuarioId: number, fechaInicio?: string, fechaFin?: string, servidor = true): Observable<Jornada[]> {
    return this.genericCrudService.onCustomQuery(
      this.getJornadasPorUsuario,
      { usuarioId, fechaInicio, fechaFin },
      servidor
    );
  }


  onRegistrarEntrada(contexto: MarcacionContexto, servidor = true): Observable<Marcacion> {
    const input = new MarcacionInput();
    input.usuarioId = contexto.usuarioId || this.mainService.usuarioActual?.id;
    input.tipo = TipoMarcacion.ENTRADA;
    input.sucursalEntradaId = contexto.sucursalId;
    input.fechaEntrada = this.toLocalIsoString(new Date());
    input.latitud = contexto.latitud;
    input.longitud = contexto.longitud;
    input.precisionGps = contexto.precisionGps;
    input.distanciaSucursalMetros = contexto.distanciaSucursalMetros;
    input.deviceId = contexto.deviceId;
    input.deviceInfo = contexto.deviceInfo;
    input.embedding = contexto.embedding;

    return this.onSaveMarcacion(input, servidor, { networkError: { propagate: true, show: false } }).pipe(
      catchError(err => {
        if (servidor) {
          return this.onSaveMarcacion(input, false);
        }
        return throwError(() => err);
      })
    );
  }

  onRegistrarSalida(
    marcacionId: number,
    contexto: MarcacionContexto,
    servidor = true
  ): Observable<Marcacion> {
    const input = new MarcacionInput();
    input.id = marcacionId;
    input.tipo = TipoMarcacion.SALIDA;
    input.sucursalSalidaId = contexto.sucursalId;
    input.fechaSalida = this.toLocalIsoString(new Date());
    input.latitud = contexto.latitud;
    input.longitud = contexto.longitud;
    input.precisionGps = contexto.precisionGps;
    input.distanciaSucursalMetros = contexto.distanciaSucursalMetros;

    return this.onSaveMarcacion(input, servidor, { networkError: { propagate: true, show: false } }).pipe(
      catchError(err => {
        if (servidor) {
          return this.onSaveMarcacion(input, false);
        }
        return throwError(() => err);
      })
    );
  }

  private toLocalIsoString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, -1);
    return localISOTime;
  }

  onImprimirReporteMarcaciones(usuarioId?: number, fechaInicio?: string, fechaFin?: string, servidor = true) {
    this.genericCrudService.onCustomQuery(this.imprimirReporteMarcaciones, {
      usuarioId: usuarioId,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      usuarioResponsableId: this.mainService.usuarioActual?.id
    }, servidor).subscribe(res => {
      if (res != null) {
        this.reporteService.onAdd('Reporte de Marcaciones', res);
        this.tabService.addTab(new Tab(ReportesComponent, 'Reportes', null, ListMarcacionComponent));
      }
    });
  }
}
