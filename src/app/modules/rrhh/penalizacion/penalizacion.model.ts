import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export type PenalizacionTipo =
  'TARDANZA' | 'AUSENCIA' | 'QUEJA_CLIENTE' | 'AMBIENTE_LABORAL' |
  'DANIO_MATERIAL' | 'COMISION_DESCUENTO' | 'ADVERTENCIA' | 'OTRO';

/**
 * Amonestacion: no descuenta plata. Se registra, se cuenta y se imprime como acta
 * firmable, pero queda fuera de la liquidacion y de los KPIs de penalizaciones.
 */
export const TIPO_ADVERTENCIA: PenalizacionTipo = 'ADVERTENCIA';

export class Penalizacion {
  id: number;
  funcionario: Funcionario;
  jornadaId: number;
  sucursalId: number;
  tipo: PenalizacionTipo;
  descripcion: string;
  monto: number;
  fecha: string;
  autoGenerada: boolean;
  anulada: boolean;
  registradoPor: Usuario;
  numeroAdvertencia: number;
  firmada: boolean;
  fechaHecho: string;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      jornadaId: this.jornadaId,
      sucursalId: this.sucursalId,
      tipo: this.tipo,
      descripcion: this.descripcion,
      monto: this.monto,
      fecha: this.fecha,
      autoGenerada: this.autoGenerada,
      anulada: this.anulada,
      registradoPorId: this.registradoPor?.id,
      numeroAdvertencia: this.numeroAdvertencia,
      firmada: this.firmada,
      fechaHecho: this.fechaHecho
    };
  }
}
