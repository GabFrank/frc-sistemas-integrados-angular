import { Barrio } from "../../general/barrio/barrio.model";
import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { FuncionarioComponent } from "../../personas/funcionarios/funcionario/funcionario.component";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Venta } from "../venta/venta.model";
import { Vuelto } from "../vuelto/vuelto.model";
import { DeliveryEstado } from "./enums";
import { PrecioDelivery } from "./precio-delivery.model";

export class Delivery {
    id: number;
    venta: Venta;
    entregador: Funcionario;
    vehiculo: number;
    direccion: string;
    telefono: string;
    creadoEn: Date;
    usuario: Usuario;
    precio: PrecioDelivery;
    estado: DeliveryEstado;
    vuelto: Vuelto;
    barrio: Barrio;
}