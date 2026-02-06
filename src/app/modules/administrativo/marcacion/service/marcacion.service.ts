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
    private getJornadasPorUsuario: GetJornadasPorUsuarioGQL
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

  onRegistrarEntrada(
    usuarioId: number,
    sucursalId: number,
    latitud?: number,
    longitud?: number,
    precisionGps?: number,
    distanciaSucursalMetros?: number,
    deviceId?: string,
    deviceInfo?: string,
    presencial = true,
    embedding?: number[],
    servidor = true
  ): Observable<Marcacion> {
    const input = new MarcacionInput();
    input.usuarioId = usuarioId || this.mainService.usuarioActual?.id;
    input.tipo = TipoMarcacion.ENTRADA;
    input.sucursalEntradaId = sucursalId;
    input.fechaEntrada = this.toLocalIsoString(new Date());
    input.latitud = latitud;
    input.longitud = longitud;
    input.precisionGps = precisionGps;
    input.distanciaSucursalMetros = distanciaSucursalMetros;
    input.deviceId = deviceId;
    input.deviceInfo = deviceInfo;
    input.presencial = presencial;
    input.embedding = embedding;

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
    sucursalId: number,
    latitud?: number,
    longitud?: number,
    precisionGps?: number,
    distanciaSucursalMetros?: number,
    servidor = true
  ): Observable<Marcacion> {
    const input = new MarcacionInput();
    input.id = marcacionId;
    input.tipo = TipoMarcacion.SALIDA;
    input.sucursalSalidaId = sucursalId;
    input.fechaSalida = this.toLocalIsoString(new Date());
    input.latitud = latitud;
    input.longitud = longitud;
    input.precisionGps = precisionGps;
    input.distanciaSucursalMetros = distanciaSucursalMetros;

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
}
