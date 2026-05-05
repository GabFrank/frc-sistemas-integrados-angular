import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HoraServidorService, ZONA_OFFSET_PARAGUAY } from '../../../../../shared/services/hora-servidor.service';

@UntilDestroy()
@Component({
  selector: 'reloj-header',
  template: `
    <div fxLayout="column" class="header-moderno" fxLayoutGap="16px" fxLayoutAlign="center center">
      <div fxLayout="column" fxLayoutAlign="center center">
        <!-- Offset fijo -03:00 evita bug ICU con zona IANA America/Asuncion en Electron; instante del servidor. -->
        <span class="reloj-digital">{{ horaActual | date:'HH:mm:ss':ZONA_OFFSET_PARAGUAY }}</span>
        <span class="fecha-actual">{{ horaActual | date:'EEEE, d MMMM y':ZONA_OFFSET_PARAGUAY | titlecase }}</span>
        <span class="sync-status" *ngIf="!sincronizado">Sincronizando con servidor...</span>
      </div>
    </div>
  `,
  styleUrls: ['./reloj-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelojHeaderComponent implements OnInit, OnDestroy {

  readonly ZONA_OFFSET_PARAGUAY = ZONA_OFFSET_PARAGUAY;

  horaActual: Date = new Date();
  sincronizado = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private horaServidorService: HoraServidorService
  ) { }

  ngOnInit(): void {
    this.horaServidorService.horaActual$
      .pipe(untilDestroyed(this))
      .subscribe(hora => {
        this.horaActual = hora;
        this.sincronizado = this.horaServidorService.estaSincronizado();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void { }
}
