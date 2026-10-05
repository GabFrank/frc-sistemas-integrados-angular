import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AVISO_ALTA_SIN_CONFIRMAR, EstadoCargaBien, EstadoCargaCuotas } from '../../forms/estado-formulario-bien';

/**
 * Carteles de carga de un formulario de bien: el bien que no cargó, sus cuotas que no cargaron, o el ente (solo
 * archivos). Con cualquiera de los dos primeros el formulario no deja guardar (#390).
 */
@Component({
  selector: 'app-bien-estado-carga',
  templateUrl: './bien-estado-carga.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BienEstadoCargaComponent {
  @Input() bien: EstadoCargaBien = 'nuevo';
  @Input() cuotas: EstadoCargaCuotas = 'sin-cargar';
  /** El bien estaba en «pagando» al cargarlo: solo entonces importan sus cuotas. */
  @Input() eraPagando = false;
  @Input() enteFallo = false;
  /** Un alta quedó sin confirmar: no se guarda más desde el formulario. */
  @Input() altaSinConfirmar = false;
  @Output() cerrar = new EventEmitter<void>();
  readonly textoAltaSinConfirmar = AVISO_ALTA_SIN_CONFIRMAR;
  @Output() reintentarBien = new EventEmitter<void>();
  @Output() reintentarCuotas = new EventEmitter<void>();
}
