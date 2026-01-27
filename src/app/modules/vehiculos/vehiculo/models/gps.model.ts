import { Vehiculo } from './vehiculo.model';
import { Telemetria } from './telemetria.model';

export class Gps {
    id: number;
    imei: string;
    vehiculo: Vehiculo;
    modeloTracker: string;
    simNumero: string;
    activo: boolean;
    creadoEm: Date;
    ultimaTelemetria: Telemetria;
}
