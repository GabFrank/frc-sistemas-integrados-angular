import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { PrecioPorSucursal } from "./precio-por-sucursal.model";

export class PromocionPorSucursal {
    id: number;
    precio: PrecioPorSucursal;
    sucursal: Sucursal;
    activo: boolean;
    esPromocion: boolean;
    tipoPromocion?: string;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): PromocionPorSucursalInput {
        let input = new PromocionPorSucursalInput();
        input.id = this?.id;
        input.precioId = this?.precio?.id;
        input.sucursalId = this?.sucursal?.id;
        input.activo = this?.activo;
        input.esPromocion = this?.esPromocion;
        input.tipoPromocion = this?.tipoPromocion;
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class PromocionPorSucursalInput {
    id?: string | number;
    precioId?: string | number;
    sucursalId?: string | number;
    activo?: boolean;
    esPromocion?: boolean;
    tipoPromocion?: string;
    usuarioId?: string | number;
} 