import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { Vale } from '../vale.model';
import { ValeService } from '../vale.service';

export interface ConfirmarValeDialogData {
  vale: Vale;
}

@UntilDestroy()
@Component({
  selector: 'app-confirmar-vale-dialog',
  templateUrl: './confirmar-vale-dialog.component.html',
  styleUrls: ['./confirmar-vale-dialog.component.scss']
})
export class ConfirmarValeDialogComponent implements OnInit {

  vale: Vale;
  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null, [Validators.required]);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ConfirmarValeDialogData,
    private dialogRef: MatDialogRef<ConfirmarValeDialogComponent>,
    private valeService: ValeService,
    private cajaVirtualService: CajaVirtualService,
    private mainService: MainService
  ) {
    this.vale = data.vale;
  }

  ngOnInit(): void {
    this.cajaVirtualService.onGetActivas()
      .pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => {
        this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR');
      });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onConfirmar() {
    if (this.cajaControl.invalid) { return; }
    this.valeService.onConfirmar(this.vale.id, this.cajaControl.value, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
