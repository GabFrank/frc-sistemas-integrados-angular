import { AsistenciaResumen, EstadoAsistenciaDia } from './legajo.model';

/** Mes calendario que se está mirando en la asistencia del legajo. `mes` va de 1 a 12. */
export interface PeriodoAsistencia { anho: number; mes: number; }

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
  'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const ESTADO_ASISTENCIA_TEXTO: Record<EstadoAsistenciaDia, string> = {
  TRABAJADO: 'A tiempo',
  TARDANZA: 'Llegada tardía',
  AUSENCIA_JUSTIFICADA: 'Ausencia justificada',
  AUSENCIA_INJUSTIFICADA: 'Ausencia injustificada',
};

export function periodoActual(): PeriodoAsistencia {
  const hoy = new Date();
  return { anho: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

export function moverPeriodo(p: PeriodoAsistencia, delta: number): PeriodoAsistencia {
  const d = new Date(p.anho, p.mes - 1 + delta, 1);
  return { anho: d.getFullYear(), mes: d.getMonth() + 1 };
}

export function esPeriodoActual(p: PeriodoAsistencia): boolean {
  const actual = periodoActual();
  return p.anho === actual.anho && p.mes === actual.mes;
}

export function textoPeriodo(p: PeriodoAsistencia): string {
  return `${MESES[p.mes - 1]} ${p.anho}`;
}

export function textoPuntaje(r: AsistenciaResumen): string {
  return r?.puntaje != null ? `${r.puntaje.toFixed(1)} / 10` : 'Sin datos';
}

/** Por qué no hay nada que mostrar, o null si hay días evaluados. */
export function motivoSinAsistencia(r: AsistenciaResumen): string {
  if (r == null) { return 'No se pudo leer la asistencia.'; }
  if (!r.tieneHorario) { return 'El funcionario no tiene un horario asignado: no se puede evaluar su asistencia.'; }
  if (!r.diasEsperados) { return 'Sin días laborables evaluados en este mes.'; }
  return null;
}

/** yyyy-MM-dd → dd/MM/yyyy, sin pasar por Date para no correr el día por la zona horaria. */
export function fechaCorta(fecha: string): string {
  const [a, m, d] = (fecha || '').split('-');
  return d ? `${d}/${m}/${a}` : '';
}
