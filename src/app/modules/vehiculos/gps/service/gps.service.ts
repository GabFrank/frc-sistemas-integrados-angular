import { Injectable, inject } from '@angular/core';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { Gps } from '../models/gps.model';
import { GpsInput } from '../models/gps-input.model';
import { SaveGpsGQL } from '../graphql/saveGps';
import { DeleteGpsGQL } from '../graphql/deleteGps';
import { GpsByIdGQL } from '../graphql/gpsById';
import { GpsListGQL } from '../graphql/gpsList';
import { GpsSearchGQL } from '../graphql/gpsSearch';
import { GpsByVehiculoGQL } from '../graphql/gpsByVehiculo';
import { GpsByImeiGQL } from '../graphql/gpsByImei';
import { EnviarComandoGpsGQL } from '../graphql/enviarComandoGps';
import { GuardarConfigAlertasGpsGQL } from '../graphql/guardarConfigAlertasGps';

@Injectable({
    providedIn: 'root'
})
export class GpsService {
    private genericService = inject(GenericCrudService);
    private saveGpsGQL = inject(SaveGpsGQL);
    private deleteGpsGQL = inject(DeleteGpsGQL);
    private gpsByIdGQL = inject(GpsByIdGQL);
    private gpsListGQL = inject(GpsListGQL);
    private gpsSearchGQL = inject(GpsSearchGQL);
    private gpsByVehiculoGQL = inject(GpsByVehiculoGQL);
    private gpsByImeiGQL = inject(GpsByImeiGQL);
    private enviarComandoGpsGQL = inject(EnviarComandoGpsGQL);
    private guardarConfigAlertasGpsGQL = inject(GuardarConfigAlertasGpsGQL);

    onGetById(id: number): Observable<Gps> {
        return this.genericService.onGetById(this.gpsByIdGQL, id);
    }

    onSave(input: GpsInput): Observable<Gps> {
        return this.genericService.onSave(this.saveGpsGQL, input);
    }

    onDelete(id: number): Observable<boolean> {
        return this.genericService.onDelete(
            this.deleteGpsGQL,
            id,
            '¿Eliminar GPS?',
            null,
            true,
            true,
            '¿Está seguro que desea eliminar este GPS?'
        );
    }

    onSearch(texto: string): Observable<Gps[]> {
        return this.genericService.onGetByTexto(this.gpsSearchGQL, texto);
    }

    onGetList(page: number, size: number): Observable<Gps[]> {
        return this.genericService.onCustomQuery(this.gpsListGQL, { page, size });
    }

    onGetByVehiculoId(vehiculoId: number): Observable<Gps[]> {
        return this.genericService.onCustomQuery(this.gpsByVehiculoGQL, { vehiculoId });
    }

    onGetByImei(imei: string): Observable<Gps> {
        return this.genericService.onCustomQuery(this.gpsByImeiGQL, { imei });
    }

    onEnviarComando(id: number, tipo: string, valor?: string): Observable<boolean> {
        return this.genericService.onCustomMutation(this.enviarComandoGpsGQL, { id, tipo, valor });
    }

    onGuardarConfigAlertas(id: number, alertaVelocidad: boolean, velocidadLimite: number,
        alertaVibracion: boolean, alertaBateriaBaja: boolean, alertaAcc: boolean): Observable<Gps> {
        return this.genericService.onCustomMutation(this.guardarConfigAlertasGpsGQL, {
            id, alertaVelocidad, velocidadLimite, alertaVibracion, alertaBateriaBaja, alertaAcc
        });
    }
}
