import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnInit,
    OnDestroy
} from '@angular/core';
import { interval } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'reloj-header',
    template: `
    <div fxLayout="column" class="header-moderno" fxLayoutGap="16px" fxLayoutAlign="center center">
      <div fxLayout="column" fxLayoutAlign="center center">
        <span class="reloj-digital">{{ horaActual | date:'HH:mm:ss' }}</span>
        <span class="fecha-actual">{{ horaActual | date:'EEEE, d MMMM y' | titlecase }}</span>
      </div>
    </div>
  `,
    styleUrls: ['./reloj-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelojHeaderComponent implements OnInit, OnDestroy {

    horaActual: Date = new Date();

    constructor(private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        interval(1000)
            .pipe(untilDestroyed(this))
            .subscribe(() => {
                this.horaActual = new Date();
                this.cdr.markForCheck();
            });
    }

    ngOnDestroy(): void { }
}
