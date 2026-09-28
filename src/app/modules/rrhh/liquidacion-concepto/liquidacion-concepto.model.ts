import { Usuario } from '../../personas/usuarios/usuario.model';

/**
 * Concepto del catalogo `rrhh.liquidacion_concepto`. Los items de liquidacion lo
 * referencian por `codigo` (un String, no una FK), asi que el codigo es la llave real
 * contra lo ya emitido.
 */
export class LiquidacionConcepto {
  id: number;
  codigo: string;
  descripcion: string;
  esHaber: boolean;
  esCalculadoAuto: boolean;
  esRemunerativo: boolean;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): LiquidacionConceptoInput {
    return {
      id: this.id,
      codigo: this.codigo,
      descripcion: this.descripcion,
      esHaber: this.esHaber,
      esCalculadoAuto: this.esCalculadoAuto,
      esRemunerativo: this.esRemunerativo,
      activo: this.activo,
      usuarioId: this.usuario?.id
    };
  }
}

export interface LiquidacionConceptoInput {
  id: number;
  codigo: string;
  descripcion: string;
  esHaber: boolean;
  esCalculadoAuto: boolean;
  esRemunerativo: boolean;
  activo: boolean;
  usuarioId: number;
}
