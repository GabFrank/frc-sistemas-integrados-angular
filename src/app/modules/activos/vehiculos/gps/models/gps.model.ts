import { Vehiculo } from '../../vehiculo/models/vehiculo.model';
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
    ultimaLatitud: number;
    ultimaLongitud: number;
    ultimaFechaReporte: Date;
    ultimaIgnicion: boolean;
    ultimaVelocidad: number;
    modoSueno: boolean;
    intervaloReporte: number;
    motorBloqueado: boolean;
    alertaVelocidad: boolean;
    velocidadLimite: number;
    alertaVibracion: boolean;
    alertaBateriaBaja: boolean;
    alertaAcc: boolean;
}
