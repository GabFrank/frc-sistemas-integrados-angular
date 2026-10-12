import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { Vale } from '../vale.model';
import { ValeService } from '../vale.service';
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';

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
  puedeAprobar = false;
  // Mientras la query no responde no se muestra el cartel de "no hay cajas":
  // el select vacio inicial no significa que no existan cajas mayores activas.
  cargandoCajas = true;
  /** La lista de cajas no se pudo leer: no es lo mismo que «no hay cajas» (#390). */
  cajasNoCargadas = false;

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
    this.puedeAprobar = this.mainService.tieneAlgunRol(['RRHH APROBAR']);
    this.cajaVirtualService.onGetActivas()
      .pipe(
        // Sin esto el diálogo queda en «cargando cajas» para siempre ante un error de red (#390).
        terminarSiFalla(() => {
          this.cajasNoCargadas = true;
          this.cargandoCajas = false;
        }),
        untilDestroyed(this)
      )
      .subscribe((res: CajaVirtual[]) => {
        this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR');
        this.cajasNoCargadas = res == null;
        this.cargandoCajas = false;
      });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onConfirmar() {
    if (this.cajaControl.invalid) { return; }
    // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
    this.valeService.onConfirmar(this.vale.id, this.cajaControl.value, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe({ next: res => { if (res != null) this.dialogRef.close(res); }, error: () => {} });
  }
}
