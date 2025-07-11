import { Moneda } from "../../../financiero/moneda/moneda.model";
import { RecepcionMercaderia } from "./recepcion-mercaderia.model";

export class RecepcionCostoAdicional {
    id: number;
    recepcionMercaderia: RecepcionMercaderia;
    descripcion: string;
    monto: number;
    moneda: Moneda;
} 