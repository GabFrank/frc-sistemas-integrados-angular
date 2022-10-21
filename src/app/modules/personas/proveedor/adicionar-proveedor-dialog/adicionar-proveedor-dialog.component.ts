import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Ciudad } from '../../../general/ciudad/ciudad.model';
import { CiudadService } from '../../../general/ciudad/ciudad.service';
import { Pais } from '../../../general/pais/pais.model';
import { AdicionarPersonaDialogComponent } from '../../persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { BuscarPersonaData, BuscarPersonaDialogComponent } from '../../persona/buscar-persona-dialog/buscar-persona-dialog.component';
import { Persona } from '../../persona/persona.model';
import { PersonaService } from '../../persona/persona.service';
import { Proveedor, ProveedorInput } from '../proveedor.model';
import { ProveedorService } from '../proveedor.service';

export class AdicionarProveedorData {
  proveedor: Proveedor;
}

@Component({
  selector: 'app-adicionar-proveedor-dialog',
  templateUrl: './adicionar-proveedor-dialog.component.html',
  styleUrls: ['./adicionar-proveedor-dialog.component.scss']
})
export class AdicionarProveedorDialogComponent implements OnInit {

  selectedProveedor: Proveedor
  selectedPersona: Persona;
  selectedCiudad: Ciudad;
  selectedPais: Pais;

  nombreControl = new FormControl(null)
  creditoControl = new FormControl(false);
  chequeDiasControl = new FormControl(8);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarProveedorData,
    private matDialogRef: MatDialogRef<AdicionarProveedorDialogComponent>,
    private personaService: PersonaService,
    private proveedorService: ProveedorService,
    private ciudadService: CiudadService,
    private matDialog: MatDialog
  ) {
    if (data?.proveedor != null) {
      this.selectedProveedor = data?.proveedor;
    }
  }

  ngOnInit(): void {
    this.nombreControl.disable()
  }

  onSearchPersona() {
    this.matDialog.open(BuscarPersonaDialogComponent, {
      width: '80%',
      height: '80%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.onSelectPersona(res)
      }
    })
  }

  onSelectPersona(persona: Persona) {
    this.nombreControl.enable()
    this.nombreControl.setValue(persona?.nombre)
    this.nombreControl.disable()
    this.selectedPersona = persona;
  }

  onAddPersona() {
    this.matDialog.open(AdicionarPersonaDialogComponent, {
      width: '80%',
      height: '80%'
    }).afterClosed().subscribe(res => {
      if (res != null) {
        this.onSelectPersona(res)
      }
    })
  }

  onCancelar() {
    this.matDialogRef.close(null)
  }

  onGuardar() {
    let proveedorInput = new ProveedorInput;
    proveedorInput.chequeDias = this.chequeDiasControl.value;
    proveedorInput.credito = this.creditoControl.value;
    proveedorInput.personaId = this.selectedPersona.id;
    this.proveedorService.onSave(proveedorInput).subscribe(res => {
      if (res != null) {
        this.matDialogRef.close(res)
      }
    })
  }

  onClearData() {
    this.onSelectPersona(null)
  }

}
