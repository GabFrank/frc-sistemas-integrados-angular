import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { DescuentoJustificativo, TipoJustificativo } from '../../justificativo/justificativo.model';
import { JustificativoService } from '../../justificativo/justificativo.service';

@UntilDestroy()
@Component({
  selector: 'app-edit-tipo-justificativo-dialog',
  templateUrl: './edit-tipo-justificativo-dialog.component.html',
  styleUrls: ['./edit-tipo-justificativo-dialog.component.scss']
})
export class EditTipoJustificativoDialogComponent implements OnInit {

  titulo = 'Nuevo tipo de justificativo';
  esSistema = false;

  descuentoOpciones: { valor: DescuentoJustificativo; label: string }[] = [
    { valor: 'NO', label: 'No descuenta' },
    { valor: 'MEDIO_DIA', label: 'Medio día' },
    { valor: 'DIA_COMPLETO', label: 'Día completo' }
  ];

  nombreControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null);
  evitaPenalizacionControl = new FormControl(true);
  descuentaSalarioControl = new FormControl('NO');
  requiereDocumentoControl = new FormControl(false);
  activoControl = new FormControl(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EditTipoJustificativoDialogComponent>,
    private service: JustificativoService,
    private mainService: MainService
  ) { }

  ngOnInit(): void {
    const t: TipoJustificativo = this.data?.tipo;
    if (t != null) {
      this.titulo = 'Editar tipo de justificativo';
      this.esSistema = !!t.generadoPorSistema;
      this.nombreControl.setValue(t.nombre);
      this.descripcionControl.setValue(t.descripcion);
      this.evitaPenalizacionControl.setValue(t.evitaPenalizacion);
      this.descuentaSalarioControl.setValue(t.descuentaSalario || 'NO');
      this.requiereDocumentoControl.setValue(t.requiereDocumento);
      this.activoControl.setValue(t.activo);
      // los tipos del sistema no se renombran (otros modulos los buscan por nombre)
      if (this.esSistema) { this.nombreControl.disable(); }
    }
  }

  onCancelar() { this.dialogRef.close(null); }

  onGuardar() {
    if (this.nombreControl.invalid) { return; }
    const input: any = {
      id: this.data?.tipo?.id,
      nombre: this.nombreControl.value ? this.nombreControl.value.toUpperCase() : this.data?.tipo?.nombre,
      descripcion: this.descripcionControl.value,
      evitaPenalizacion: this.evitaPenalizacionControl.value,
      descuentaSalario: this.descuentaSalarioControl.value,
      requiereDocumento: this.requiereDocumentoControl.value,
      activo: this.activoControl.value,
      usuarioId: this.mainService.usuarioActual?.id
    };
    this.service.onSaveTipo(input).pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
