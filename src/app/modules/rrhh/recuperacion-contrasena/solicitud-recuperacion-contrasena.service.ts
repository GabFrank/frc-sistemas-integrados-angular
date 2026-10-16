import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { AprobarRecuperacionContrasenaGQL } from './graphql/AprobarRecuperacionContrasena';
import { RechazarRecuperacionContrasenaGQL } from './graphql/RechazarRecuperacionContrasena';
import { SolicitudesRecuperacionContrasenaGQL } from './graphql/SolicitudesRecuperacionContrasena';

/** Lo que hace RRHH con las solicitudes de recuperación de contraseña. Todo va al central. */
@Injectable({ providedIn: 'root' })
export class SolicitudRecuperacionContrasenaService {
  constructor(
    private genericService: GenericCrudService,
    private solicitudesGQL: SolicitudesRecuperacionContrasenaGQL,
    private aprobarGQL: AprobarRecuperacionContrasenaGQL,
    private rechazarGQL: RechazarRecuperacionContrasenaGQL,
  ) { }

  onGetPage(estado: string, page: number, size: number): Observable<any> {
    return this.genericService.onCustomQuery(this.solicitudesGQL, { estado, page, size }, true);
  }

  onAprobar(id: number): Observable<any> {
    return this.genericService.onCustomMutation(this.aprobarGQL, { id }, true);
  }

  onRechazar(id: number, motivo: string): Observable<any> {
    return this.genericService.onCustomMutation(this.rechazarGQL, { id, motivo }, true);
  }
}
