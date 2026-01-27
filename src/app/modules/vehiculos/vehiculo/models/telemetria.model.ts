export interface Telemetria {
    id: number;
    fechaServidor: string;
    fechaGps: string;
    latitud: number;
    longitud: number;
    velocidad: number;
    direccion: number;
    ignicion: boolean;
    alarma: string;
    jsonData: any;
}
