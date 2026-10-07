import { Barrio } from "../../general/barrio/barrio.model";
import { Funcionario } from "../../personas/funcionarios/funcionario.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Venta } from "../venta/venta.model";
import { Vuelto } from "../vuelto/vuelto.model";
import { DeliveryEstado } from "./enums";
import { DeliveryInput } from "./graphql/delivery-input.model";
import { PrecioDelivery } from "./precio-delivery.model";

export class Delivery {
    id: number;
    venta: Venta;
    entregador: Funcionario;
    vehiculo: any;
    direccion: string;
    telefono: string;
    creadoEn: Date;
    usuario: Usuario;
    precio: PrecioDelivery;
    estado: DeliveryEstado;
    /** Comprobantes ESC/POS (base64) que devuelve la filial en modo "Imprimir desde esta PC". */
    ticketEscpos?: string;
    vuelto: Vuelto;
    barrio: Barrio;
    duracion: any;
    fechaConcluido: Date;
    /**
     * Solo en memoria: un cobro de este delivery quedó sin confirmar (pudo haberse guardado en el filial). No se
     * cobra ni se guarda hasta volver a leerlo desde la lista (#390).
     */
    cobroIncierto?: boolean;

    toInput(): DeliveryInput {
        let input = new DeliveryInput()
        input.id = this.id
        input.ventaId = this.venta?.id
        input.entregadorId = this.entregador?.id
        input.vehiculoId = this.vehiculo
        input.direccion = this.direccion
        input.telefono = this.telefono
        input.estado = this.estado
        input.precioId = this.precio?.id
        input.usuarioId = this.usuario?.id
        input.barrioId = this.barrio?.id
        input.vueltoId = this.vuelto?.id
        input.fechaConcluido = this.fechaConcluido
        return input;
    }
}
