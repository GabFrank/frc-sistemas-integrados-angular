import { Component, HostBinding, Input } from '@angular/core';

/**
 * Marco comun de los dialogos genericos: cabecera con el degrade del buscador, contenido y barra de
 * acciones. El estilo vive aca y no copiado en cada dialogo.
 *
 * - `tono="peligro"`: misma cabecera en rojo, para eliminar/anular.
 * - `llenar`: ocupa todo el alto del dialogo y el contenido no scrollea (lo maneja quien lo usa, como el
 *   buscador, que scrollea solo la tabla).
 *
 * @example
 * <app-dialogo-base titulo="Eliminar caja" tono="peligro">
 *   <p>¿Seguro?</p>
 *   <div acciones>
 *     <button mat-flat-button (click)="...">No</button>
 *     <button mat-flat-button class="frc-btn-confirmar" (click)="...">Sí, eliminar</button>
 *   </div>
 * </app-dialogo-base>
 */
@Component({
  selector: 'app-dialogo-base',
  templateUrl: './dialogo-base.component.html',
  styleUrls: ['./dialogo-base.component.scss']
})
export class DialogoBaseComponent {
  @Input() titulo: string;
  @Input() tono: 'normal' | 'peligro' = 'normal';
  @Input() @HostBinding('class.llenar') llenar = false;
}
