import { Usuario } from "../../personas/usuarios/usuario.model";
import { PrecioPorSucursal } from "../precio-por-sucursal/precio-por-sucursal.model";
import { Presentacion } from "../presentacion/presentacion.model";
import { Producto } from "../producto/producto.model";
import { TipoPrecio } from "../tipo-precio/tipo-precio.model";
import { CodigoInput } from "./codigo-input.model";

export class Codigo {
    id: number
    codigo: string;
    principal: boolean;
    presentacion: Presentacion;
    activo: boolean;
    creadoEn: Date;

    toInput(): CodigoInput{
        let input = new CodigoInput()
        input.id = this?.id;
        input.codigo = this?.codigo;
        input.principal = this?.principal;
        input.activo = this?.activo;
        input.presentacionId = this?.presentacion?.id;
        return input;
    }
}