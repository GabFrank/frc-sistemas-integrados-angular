import { Vehiculo } from './vehiculo.model';
import { Sucursal } from '../../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../../../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../../../personas/usuarios/usuario.model';

export interface VehiculoSucursal {
    id?: number;
    vehiculo?: Vehiculo;
    sucursal?: Sucursal;
    responsable?: Funcionario;
    usuario?: Usuario;
    creadoEn?: Date;
}

