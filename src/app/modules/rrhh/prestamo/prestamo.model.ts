import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Moneda } from '../../financiero/moneda/moneda.model';

export type PrestamoEstado = 'ACTIVO' | 'PAGADO' | 'CANCELADO';
export type PrestamoCuotaEstado = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA' | 'CANCELADA';

export class PrestamoCuota {
  id: number;
  numero: number;
  fechaVencimiento: string;
  monto: number;
  montoPagado: number;
  estado: PrestamoCuotaEstado;
  fechaPago: string;
}

export class Prestamo {
  id: number;
  funcionario: Funcionario;
  descripcion: string;
  montoTotal: number;
  montoPagado: number;
  moneda: Moneda;
  fechaInicio: string;
  cantidadCuotas: number;
  estado: PrestamoEstado;
  observacion: string;
  cajaVirtualId: number;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      descripcion: this.descripcion,
      montoTotal: this.montoTotal,
      monedaId: this.moneda?.id,
      fechaInicio: this.fechaInicio,
      cantidadCuotas: this.cantidadCuotas,
      observacion: this.observacion
    };
  }
}
