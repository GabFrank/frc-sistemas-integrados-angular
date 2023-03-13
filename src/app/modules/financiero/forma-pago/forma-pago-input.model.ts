import { Usuario } from "../../personas/usuarios/usuario.model";
import { CuentaBancaria } from "../cuenta-bancaria/cuenta-bancaria.model";
import { Moneda } from "../moneda/moneda.model";

export class FormaPagoInput {
    id: number;
    descripcion: string;
    activo: boolean;
    moviemientoCaja: boolean;
    autorizacion: boolean;
    cuentaBancariaId: number;
    usuarioId: number;
}