import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Moneda } from '../../financiero/moneda/moneda.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { MotivoVale } from '../motivo-vale/motivo-vale.model';

export type ValeEstado = 'SOLICITADO' | 'CONFIRMADO' | 'DESCONTADO' | 'ANULADO';

export class Vale {
  id: number;
  funcionario: Funcionario;
  motivo: MotivoVale;
  monto: number;
  moneda: Moneda;
  fecha: string;
  estado: ValeEstado;
  esAdelanto: boolean;
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
      observacion: this.observacion,
      autorizadoPorId: this.autorizadoPor?.id,
      usuarioId: this.usuario?.id
    };
  }
}
