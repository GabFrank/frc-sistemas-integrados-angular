import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  onGetMarcacionesPorUsuario(usuarioId: number, fechaInicio?: string, fechaFin?: string, servidor = true): Observable<Marcacion[]> {
    return this.genericCrudService.onCustomQuery(
      this.getMarcacionesPorUsuario,
      { usuarioId, fechaInicio, fechaFin },
      servidor
    );
  }

  onSaveMarcacion(input: MarcacionInput, servidor = true): Observable<Marcacion> {
    if (!input.usuarioId) {
      input.usuarioId = this.mainService.usuarioActual?.id;
    }
    return this.genericCrudService.onSave(this.saveMarcacion, input, null, null, servidor);
  }

  onDeleteMarcacion(id: number, servidor = true): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteMarcacion,
      id,
      '¿Eliminar marcación?',
      null,
      true,
      servidor,
      '¿Está seguro que desea eliminar esta marcación?'
    );
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
    servidor = true
  ): Observable<Marcacion> {
    const input = new MarcacionInput();
    input.usuarioId = usuarioId || this.mainService.usuarioActual?.id;
    input.tipo = TipoMarcacion.ENTRADA;
    input.sucursalEntradaId = sucursalId;
    input.fechaEntrada = new Date().toISOString();
    input.latitud = latitud;
    input.longitud = longitud;
    input.precisionGps = precisionGps;
    input.distanciaSucursalMetros = distanciaSucursalMetros;
    input.deviceId = deviceId;
    input.deviceInfo = deviceInfo;
    input.presencial = presencial;

    return this.onSaveMarcacion(input, servidor);
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
    input.fechaSalida = new Date().toISOString();
    input.latitud = latitud;
    input.longitud = longitud;
    input.precisionGps = precisionGps;
    input.distanciaSucursalMetros = distanciaSucursalMetros;

    return this.onSaveMarcacion(input, servidor);
  }
}
