import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

/** Cuanto descuenta del salario un justificativo, segun su tipo. */
export type DescuentoJustificativo = 'NO' | 'MEDIO_DIA' | 'DIA_COMPLETO';

/**
 * Catalogo de tipos. Cada tipo define su comportamiento (evitar penalizacion,
 * descontar salario, requerir documento), por eso se pueden agregar tipos
 * nuevos sin desplegar codigo.
 */
export class TipoJustificativo {
  id: number;
  nombre: string;
  descripcion: string;
  evitaPenalizacion: boolean;
  descuentaSalario: DescuentoJustificativo;
  requiereDocumento: boolean;
  generadoPorSistema: boolean;
  activo: boolean;
  usuario: Usuario;

  toInput(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      evitaPenalizacion: this.evitaPenalizacion,
      descuentaSalario: this.descuentaSalario,
      requiereDocumento: this.requiereDocumento,
      activo: this.activo,
      usuarioId: this.usuario?.id
    };
  }
}

/** Justificativo de un dia: explica por que ese dia no fue una jornada normal. */
export class Justificativo {
  id: number;
  funcionario: Funcionario;
  fecha: string;
  tipo: TipoJustificativo;
  jornadaId: number;
  sucursalId: number;
  observacion: string;
  documento: any;
  registradoPor: Usuario;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      fecha: this.fecha,
      tipoId: this.tipo?.id,
      jornadaId: this.jornadaId,
      sucursalId: this.sucursalId,
      observacion: this.observacion,
      documentoId: this.documento?.id,
      registradoPorId: this.registradoPor?.id
    };
  }
}
