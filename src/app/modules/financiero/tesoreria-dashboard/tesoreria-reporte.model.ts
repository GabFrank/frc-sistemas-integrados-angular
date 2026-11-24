// Modelos de solo lectura para el dashboard de Tesorería.
// Reflejan tesoreria-reporte.graphqls del backend (central) 1:1 — no tienen toInput()
// porque no se persisten desde el desktop.

export class SaldoTesoreria {
  monedaId: number;
  moneda: string;
  efectivo: number;
  banco: number;
  bancoReservado: number;
  total: number;
}

/** Saldo − reservado por moneda (central #601). Consulta aparte: ver saldoDisponibleTesoreriaQuery. */
export class DisponibleTesoreria {
  monedaId: number;
  bancoDisponible: number;
  totalDisponible: number;
}

export class VencimientoTesoreria {
  tipo: string;
  referenciaId: number;
  descripcion: string;
  monto: number;
  fecha: Date;
  diasRestantes: number;
  // Calculado en el componente al cargar (no es campo del backend) — evita llamar
  // funciones desde el HTML para decidir el color de la fila.
  vencido?: boolean;
}

export class AgingTesoreria {
  porVencer: number;
  vencido: number;
}
