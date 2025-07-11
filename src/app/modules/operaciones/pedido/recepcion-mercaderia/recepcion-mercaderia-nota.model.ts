import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { RecepcionMercaderia } from "./recepcion-mercaderia.model";

export class RecepcionMercaderiaNota {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    notaRecepcion: NotaRecepcion;
} 