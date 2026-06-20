import { AccionMarcacionPendiente } from '../enums/accion-marcacion-pendiente.enum';
import { Jornada } from './jornada.model';

export class EstadoMarcacionUsuario {
  jornadaRelevante: Jornada;
  accionPendiente: AccionMarcacionPendiente;
  puedeMarcarEntrada: boolean;
  puedeMarcarSalida: boolean;
  puedeMarcarSalidaAlmuerzo: boolean;
  puedeMarcarEntradaAlmuerzo: boolean;
  estaEnJornada: boolean;
}
