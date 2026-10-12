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

export type EstadoAsistenciaDia = 'TRABAJADO' | 'TARDANZA' | 'AUSENCIA_JUSTIFICADA' | 'AUSENCIA_INJUSTIFICADA';

export interface AsistenciaDia {
  fecha?: string;   // yyyy-MM-dd
  estado?: EstadoAsistenciaDia;
  minutosLlegadaTardia?: number;
  minutosLlegadaTardiaAlmuerzo?: number;
  justificativo?: string;
}

/** Asistencia de un funcionario en un mes. La calcula el central; acá solo se muestra. */
export interface AsistenciaResumen {
  anho?: number;
  mes?: number;
  tieneHorario?: boolean;
  diasEsperados?: number;
  diasTrabajados?: number;
  llegadasTardias?: number;
  ausenciasJustificadas?: number;
  ausenciasInjustificadas?: number;
  puntualidad?: number;   // null sin días trabajados
  puntaje?: number;       // 0..10; null sin días esperados
  dias?: AsistenciaDia[];
}
