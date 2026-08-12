import { Cargo } from '../../empresarial/cargo/cargo.model';
import { Moneda } from '../../financiero/moneda/moneda.model';
import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export type FuncionarioDocumentoTipo =
  | 'CEDULA' | 'CONTRATO' | 'CERTIFICADO' | 'CV'
  | 'ANTECEDENTES' | 'CARNET_SALUD' | 'TITULO_ACADEMICO' | 'FOTO_PERFIL' | 'OTRO';

export interface FuncionarioCargoHistorico {
  id: number;
  funcionario?: Funcionario;
  cargo?: Cargo;
  fechaDesde?: string;
  fechaHasta?: string;
  motivo?: string;
  autorizadoPor?: Usuario;
  creadoEn?: Date;
}

export interface FuncionarioSalarioHistorico {
  id: number;
  funcionario?: Funcionario;
  salarioAnterior?: number;
  salarioNuevo?: number;
  moneda?: Moneda;
  fechaVigencia?: string;
  motivo?: string;
  autorizadoPor?: Usuario;
  creadoEn?: Date;
}

export interface FuncionarioDocumento {
  id: number;
  funcionario?: Funcionario;
  tipo?: FuncionarioDocumentoTipo;
  nombreArchivo?: string;
  rutaRelativa?: string;
  mimeType?: string;
  tamanoBytes?: number;
  fechaSubida?: Date;
  vencimiento?: string;
  observacion?: string;
  anulado?: boolean;
  creadoEn?: Date;
}
