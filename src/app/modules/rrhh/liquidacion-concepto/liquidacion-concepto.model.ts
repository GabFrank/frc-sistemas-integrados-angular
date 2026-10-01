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
  /** Número fijo de la operación (atajo al cargar ítems). Null = sin número. */
  numero: number;
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
      // undefined (no vino del servidor) = no cambiar; null (vaciado a propósito) = 0, sin número.
      numero: this.numero === undefined ? null : (this.numero ?? 0),
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
  numero: number;
  usuarioId: number;
}
