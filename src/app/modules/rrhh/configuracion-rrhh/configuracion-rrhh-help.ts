export interface ConfigHelp {
  titulo: string;
  descripcion: string;
  ejemplo?: string;
  impacto?: string;
}

/**
 * Ayuda curada por clave de configuración RRHH. Se muestra en el diálogo de
 * info de la pantalla de Configuración. Si una clave no está acá, el diálogo
 * cae a la descripción guardada en la base.
 */
export const CONFIGURACION_RRHH_HELP: { [clave: string]: ConfigHelp } = {

  IPS_PORCENTAJE_FUNCIONARIO: {
    titulo: 'IPS — Aporte del funcionario (%)',
    descripcion: 'Porcentaje que se descuenta del salario del funcionario como aporte al IPS.',
    ejemplo: 'Con 9 y un salario de 3.000.000, el descuento IPS es 270.000.',
    impacto: 'Se aplica como ítem DESCUENTO "IPS" en cada liquidación de sueldo.'
  },
  IPS_PORCENTAJE_PATRONAL: {
    titulo: 'IPS — Aporte patronal (%)',
    descripcion: 'Porcentaje que aporta el empleador sobre el salario (no se descuenta al funcionario).',
    ejemplo: 'Con 16.5 y un salario de 3.000.000, el aporte patronal es 495.000.',
    impacto: 'No afecta el neto del funcionario. Se usa en los reportes de nómina / IPS.'
  },
  SALARIO_MINIMO_LEGAL_PYG: {
    titulo: 'Salario mínimo legal (Gs.)',
    descripcion: 'Salario mínimo legal vigente en guaraníes. Referencia para validaciones.',
    ejemplo: 'Si se intenta fijar un salario menor a este valor, el sistema avisa.',
    impacto: 'Al cambiar el salario de un funcionario se muestra una advertencia si queda por debajo.'
  },
  DIAS_VACACIONES_HASTA_5A: {
    titulo: 'Días de vacaciones — hasta 5 años',
    descripcion: 'Días de vacaciones que devenga por año un funcionario con menos de 5 años de antigüedad.',
    ejemplo: 'Valor típico (ley PY): 12 días.',
    impacto: 'Determina los días generados al devengar vacaciones.'
  },
  DIAS_VACACIONES_5_10A: {
    titulo: 'Días de vacaciones — 5 a 10 años',
    descripcion: 'Días de vacaciones que devenga por año un funcionario con antigüedad de 5 a 10 años.',
    ejemplo: 'Valor típico (ley PY): 18 días.',
    impacto: 'Determina los días generados al devengar vacaciones.'
  },
  DIAS_VACACIONES_MAS_10A: {
    titulo: 'Días de vacaciones — más de 10 años',
    descripcion: 'Días de vacaciones que devenga por año un funcionario con más de 10 años de antigüedad.',
    ejemplo: 'Valor típico (ley PY): 30 días.',
    impacto: 'Determina los días generados al devengar vacaciones.'
  },
  INDEMNIZACION_DIAS_POR_ANIO: {
    titulo: 'Indemnización — días por año',
    descripcion: 'Días de salario que se pagan por cada año de antigüedad en la indemnización por despido injustificado.',
    ejemplo: 'Con 15, salario diario 100.000 y 3 años: 15 × 3 × 100.000 = 4.500.000.',
    impacto: 'Se usa en el cálculo del finiquito (liquidación final).'
  },
  PREAVISO_DIAS_HASTA_1A: {
    titulo: 'Preaviso — hasta 1 año',
    descripcion: 'Días de preaviso que corresponden con menos de 1 año de antigüedad.',
    ejemplo: 'Ley PY: 30 días.',
    impacto: 'En el finiquito: si no se otorgó, despido injustificado paga estos días; renuncia descuenta la mitad.'
  },
  PREAVISO_DIAS_1_5A: {
    titulo: 'Preaviso — de 1 a 5 años',
    descripcion: 'Días de preaviso que corresponden con antigüedad de 1 a 5 años.',
    ejemplo: 'Ley PY: 45 días.',
    impacto: 'En el finiquito: si no se otorgó, despido injustificado paga estos días; renuncia descuenta la mitad.'
  },
  PREAVISO_DIAS_5_10A: {
    titulo: 'Preaviso — de 5 a 10 años',
    descripcion: 'Días de preaviso que corresponden con antigüedad de 5 a 10 años.',
    ejemplo: 'Ley PY: 60 días.',
    impacto: 'En el finiquito: si no se otorgó, despido injustificado paga estos días; renuncia descuenta la mitad.'
  },
  PREAVISO_DIAS_MAS_10A: {
    titulo: 'Preaviso — más de 10 años',
    descripcion: 'Días de preaviso que corresponden con más de 10 años de antigüedad.',
    ejemplo: 'Ley PY: 90 días.',
    impacto: 'En el finiquito: si no se otorgó, despido injustificado paga estos días; renuncia descuenta la mitad.'
  },
  INDEMNIZACION_ANTIGUEDAD_MIN_DIAS: {
    titulo: 'Indemnización — antigüedad mínima (días)',
    descripcion: 'Antigüedad mínima, en días, para que corresponda indemnización por despido injustificado.',
    ejemplo: 'Con 90, un funcionario con menos de 90 días no cobra indemnización.',
    impacto: 'Por debajo de este umbral, el finiquito no incluye indemnización.'
  },
  RECARGO_HE_DIURNA: {
    titulo: 'Recargo hora extra diurna (%)',
    descripcion: 'Porcentaje de recargo sobre el valor hora para las horas extra diurnas.',
    ejemplo: 'Con 50, la hora extra diurna vale 1,5× la hora normal.',
    impacto: 'Se aplica al valorizar horas extra de tipo DIURNA.'
  },
  RECARGO_HE_NOCTURNA: {
    titulo: 'Recargo hora extra nocturna (%)',
    descripcion: 'Porcentaje de recargo sobre el valor hora para las horas extra nocturnas.',
    ejemplo: 'Con 100, la hora extra nocturna vale 2× la hora normal.',
    impacto: 'Se aplica al valorizar horas extra de tipo NOCTURNA.'
  },
  RECARGO_HE_FERIADO: {
    titulo: 'Recargo hora extra en feriado (%)',
    descripcion: 'Porcentaje de recargo sobre el valor hora para las horas extra en días feriados.',
    ejemplo: 'Con 100, la hora extra en feriado vale 2× la hora normal.',
    impacto: 'Se aplica al valorizar horas extra de tipo FERIADO.'
  },
  TOLERANCIA_TARDANZA_MIN: {
    titulo: 'Tolerancia de tardanza (minutos)',
    descripcion: 'Minutos de gracia antes de que una llegada tarde genere penalización automática.',
    ejemplo: 'Con 5, una llegada 4 minutos tarde no penaliza; 6 minutos sí.',
    impacto: 'El job diario de penalizaciones ignora tardanzas menores o iguales a esta tolerancia.'
  },
  PRESCRIPCION_VACACIONES_MESES: {
    titulo: 'Prescripción de vacaciones (meses)',
    descripcion: 'Meses tras los cuales las vacaciones no gozadas prescriben (se pierden).',
    ejemplo: 'Con 24, las vacaciones prescriben a los 2 años.',
    impacto: 'El job de prescripción marca como prescritas las vacaciones que superan este plazo.'
  },
  DIA_CIERRE_MES: {
    titulo: 'Día de cierre de nómina',
    descripcion: 'Día del mes en que cierra el período de liquidación.',
    ejemplo: '28–31 = mes calendario. Con 25, el período de "junio" va del 26 de mayo al 25 de junio.',
    impacto: 'Define el rango de fechas que toma la liquidación (jornadas, HE, penalizaciones, etc.).'
  },
  MES_AGUINALDO: {
    titulo: 'Mes de aguinaldo',
    descripcion: 'Mes en que se paga el aguinaldo (13er salario).',
    ejemplo: 'Con 12, el aguinaldo corresponde a diciembre.',
    impacto: 'Referencia para el cálculo y pago del aguinaldo anual.'
  },
  PENALIZACION_AUTO_TARDANZA: {
    titulo: 'Penalización automática por tardanza',
    descripcion: 'Habilita el job diario que genera penalizaciones automáticas por llegadas tarde.',
    ejemplo: 'true = activa; false = solo penalizaciones manuales.',
    impacto: 'Si está en false, no se generan penalizaciones automáticas.'
  },
  PENALIZACION_MONTO_TARDANZA: {
    titulo: 'Penalización — monto fijo por tardanza',
    descripcion: 'Monto fijo que se aplica por una tardanza (independiente de los minutos).',
    ejemplo: 'Con 50.000, cada tardanza penalizada suma 50.000 fijo.',
    impacto: 'Parte fija de la fórmula: monto = fijo + porMinuto × minutos.'
  },
  PENALIZACION_MONTO_POR_MINUTO_TARDANZA: {
    titulo: 'Penalización — monto por minuto',
    descripcion: 'Monto que se aplica por cada minuto de tardanza.',
    ejemplo: 'Con 1.000 y 15 minutos: 15.000 (más el monto fijo).',
    impacto: 'Parte variable de la fórmula: monto = fijo + porMinuto × minutos.'
  },
  HORAS_JORNADA_LABORAL: {
    titulo: 'Horas de la jornada laboral',
    descripcion: 'Cantidad de horas de la jornada normal. Base para valorizar la hora (y la hora extra).',
    ejemplo: 'Con 8, el valor hora = salario / días-mes / 8.',
    impacto: 'Afecta la valorización de las horas extra.'
  },
  MESES_PROMEDIO_LIQUIDACION_FINAL: {
    titulo: 'Meses a promediar en el finiquito',
    descripcion: 'Cantidad de últimas liquidaciones que se promedian para el salario base del finiquito.',
    ejemplo: 'Con 6, se promedian los haberes de las últimas 6 liquidaciones aprobadas/pagadas.',
    impacto: 'Si no hay liquidaciones previas, cae al sueldo actual del funcionario.'
  },
  DIAS_MES_PROMEDIO: {
    titulo: 'Divisor días/mes (salario diario)',
    descripcion: 'Cantidad de días por mes usada para obtener el salario diario a partir del mensual.',
    ejemplo: 'Con 30 y salario 3.000.000, el salario diario es 100.000.',
    impacto: 'Afecta la valorización de horas extra y los montos del finiquito.'
  },
  DIAS_ANIO_ANTIGUEDAD: {
    titulo: 'Divisor días/año (antigüedad)',
    descripcion: 'Cantidad de días por año usada para calcular los años de antigüedad.',
    ejemplo: 'Con 365, 1096 días de antigüedad = 3 años.',
    impacto: 'Afecta el cálculo de antigüedad en el finiquito.'
  }
};
