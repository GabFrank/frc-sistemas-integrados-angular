import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Persona } from '../../persona/persona.model';
import { PersonaService } from '../../persona/persona.service';
import { PersonaInput } from '../../persona/persona/persona-input.model';
import { Cliente } from '../cliente.model';
import { ClienteService } from '../cliente.service';

export interface AdicionarClienteData {
  ruc?: string;
  persona?: Persona;
  cliente?: Cliente;
}

@UntilDestroy()
@Component({
  selector: 'app-add-cliente-dialog',
  templateUrl: './add-cliente-dialog.component.html',
  styleUrls: ['./add-cliente-dialog.component.scss']
})
export class AddClienteDialogComponent implements OnInit {

  // @ViewChild

  selectedCliente = new Cliente;
  selectedPersona: Persona;
  rucControl = new FormControl(null, [Validators.required, Validators.minLength(7)])
  nombreControl = new FormControl(null, [Validators.required, Validators.minLength(3)])
  direccionControl = new FormControl(null)
  formGroup: FormGroup;
  isEditting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarClienteData,
    private dialogRef: MatDialogRef<AddClienteDialogComponent>,
    private clienteService: ClienteService,
    private personaService: PersonaService
  ) { }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      ruc: this.rucControl,
      nombre: this.nombreControl,
      direccion: this.direccionControl
    })

    if(this.data?.ruc != null){
      this.personaService.onSearch(this.data.ruc).pipe(untilDestroyed(this)).subscribe(res => {
        if(res?.length == 0){

        } else if(res?.length == 1){
          
        } else {

        }
      })
    }

    if (this.data.persona == null) {
      this.dialogRef.close(null)
    } else {
      this.selectedPersona = this.data.persona;
    }
    if (this.data.cliente != null) {
      Object.assign(this.selectedCliente, this.data.cliente)
      this.cargarDatos()
    } else {
      this.isEditting = true;
    }
  }

  cargarDatos() {
    this.rucControl.setValue(this.selectedCliente?.persona?.documento)
    this.nombreControl.setValue(this.selectedCliente?.persona?.nombre)
    this.direccionControl.setValue(this.selectedCliente?.persona)
    this.formGroup.disable()
  }

  onEdit() {
    this.isEditting = true;
    this.formGroup.enable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    if(this.selectedPersona == null && this.selectedCliente?.persona == null){
      let personaInput = new PersonaInput;
      personaInput.nombre = this.nombreControl.value;
      personaInput.documento = this.rucControl.value;
      personaInput.direccion = this.direccionControl.value;
      this.personaService.onSavePersona(personaInput).pipe(untilDestroyed(this))
    }
  }

}
