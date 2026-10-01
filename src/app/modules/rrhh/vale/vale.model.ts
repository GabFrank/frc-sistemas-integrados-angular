import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Moneda } from '../../financiero/moneda/moneda.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { MotivoVale } from '../motivo-vale/motivo-vale.model';

export type ValeEstado = 'SOLICITADO' | 'CONFIRMADO' | 'DESCONTADO' | 'ANULADO';
export type ValeCuotaEstado = 'PENDIENTE' | 'DESCONTADA' | 'ANULADA';

/** Cuota de un vale que se descuenta en varias liquidaciones (cantidadCuotas > 1). */
export class ValeCuota {
  id: number;
  numero: number;
  monto: number;
  fechaDescuento: string;
  estado: ValeCuotaEstado;
  liquidacionId: number;
  liquidacionFinalId: number;
}

export class Vale {
  id: number;
  funcionario: Funcionario;
  motivo: MotivoVale;
  monto: number;
  moneda: Moneda;
  fecha: string;
  estado: ValeEstado;
  esAdelanto: boolean;
  /** 1 = se descuenta entero; más de 1 = una cuota por liquidación. */
  cantidadCuotas: number;
  /** Entregado en bienes (ej. uniforme): nace confirmado sin sacar plata de caja. */
  enEspecie: boolean;
  /** Lo que falta descontar (lo calcula el backend). */
  saldoPendiente: number;
  cajaVirtualId: number;
  autorizadoPor: Usuario;
  observacion: string;
  usuario: Usuario;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      motivoId: this.motivo?.id,
      monto: this.monto,
      monedaId: this.moneda?.id,
      fecha: this.fecha,
      estado: this.estado,
      esAdelanto: this.esAdelanto,
      cantidadCuotas: this.cantidadCuotas,
      observacion: this.observacion,
      autorizadoPorId: this.autorizadoPor?.id,
      usuarioId: this.usuario?.id
    };
  }
}
