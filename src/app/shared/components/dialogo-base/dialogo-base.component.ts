import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

/**
 * Marco comun de los dialogos genericos: cabecera con el degrade del buscador, contenido y barra de
 * acciones. El estilo vive aca y no copiado en cada dialogo.
 *
 * - `tono="peligro"`: misma cabecera en rojo, para eliminar/anular.
 * - `llenar`: ocupa todo el alto del dialogo y el contenido no scrollea (lo maneja quien lo usa, como el
 *   buscador, que scrollea solo la tabla).
 *
 * El titulo lleva `mat-dialog-title`: Material le pone el id al dialogo como `aria-labelledby` y el
 * lector de pantalla lo anuncia al abrir.
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
  styleUrls: ['./dialogo-base.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.llenar]': 'llenar',
    '[class.peligro]': 'esPeligro',
  },
})
export class DialogoBaseComponent implements OnChanges {
  @Input() titulo: string;
  @Input() tono: 'normal' | 'peligro' = 'normal';
  @Input() llenar = false;

  esPeligro = false;

  ngOnChanges(): void {
    this.esPeligro = this.tono === 'peligro';
  }
}
