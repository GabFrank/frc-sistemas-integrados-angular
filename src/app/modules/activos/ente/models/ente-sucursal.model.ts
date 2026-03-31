import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Ente } from './ente.model';

export interface EnteSucursal {
    id?: number;
    ente?: Ente;
    sucursal?: Sucursal;
    responsable?: Funcionario;
    usuario?: Usuario;
    creadoEn?: Date;
}
