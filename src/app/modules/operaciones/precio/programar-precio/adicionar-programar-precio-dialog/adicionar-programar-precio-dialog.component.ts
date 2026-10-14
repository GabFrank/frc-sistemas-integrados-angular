import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PrecioPorSucursal } from '../../../../productos/precio-por-sucursal/precio-por-sucursal.model';
import { ProgramarPrecio } from '../programar-precio.model';

class AdicionarProgramarPrecioData {
  programarPrecio: ProgramarPrecio
}

@Component({
  selector: 'app-adicionar-programar-precio-dialog',
  templateUrl: './adicionar-programar-precio-dialog.component.html',
  styleUrls: ['./adicionar-programar-precio-dialog.component.scss']
})
export class AdicionarProgramarPrecioDialogComponent implements OnInit {

  selectedProgramarPrecio: ProgramarPrecio;
  selectedPrecio: PrecioPorSucursal;
  momentoCambioControl = new FormControl()
  nuevoPrecioControl = new FormControl(null, Validators.required)
  fechaCambioControl = new FormControl(null, )

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarProgramarPrecioData,
    private matDialogRef: MatDialogRef<AdicionarProgramarPrecioDialogComponent>,
  ) { }

  ngOnInit(): void {
  }

}
