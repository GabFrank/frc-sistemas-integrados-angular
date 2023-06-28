import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Ciudad } from '../../../general/ciudad/ciudad.model';
import { Persona } from '../persona.model';
import { PersonaService } from '../persona.service';
import { PersonaInput } from '../persona/persona-input.model';

export class AdicionarPersonaData {
  persona?: Persona;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-persona-dialog',
  templateUrl: './adicionar-persona-dialog.component.html',
  styleUrls: ['./adicionar-persona-dialog.component.scss']
})
export class AdicionarPersonaDialogComponent implements OnInit {

  idControl = new FormControl()
  nombreControl = new FormControl(null, Validators.required)
  apodoControl = new FormControl(null,)
  nacimientoControl = new FormControl()
  documentoControl = new FormControl(null, Validators.required)
  emailControl = new FormControl()
  direccionControl = new FormControl()
  telefonoControl = new FormControl(null, [Validators.required, Validators.minLength(10)])
  socialMediaControl = new FormControl()
  ciudadIdControl = new FormControl()
  sexoControl = new FormControl()
  maxDate = new Date()

  selectedCiudad: Ciudad;
  selectedPersona: Persona;

  formGroup: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdicionarPersonaData,
    private matDialogRef: MatDialogRef<AdicionarPersonaDialogComponent>,
    private dialogoService: DialogosService,
    private personaService: PersonaService
  ) {
    if (data?.persona != null) {
      this.selectedPersona = data.persona;
    }
  }

  ngOnInit(): void {
    this.createForm()
    this.cargarDatos()
  }

  cargarDatos() {
    if (this.selectedPersona != null) {
      this.idControl.setValue(this.selectedPersona.id)
      this.nombreControl.setValue(this.selectedPersona.nombre)
      this.apodoControl.setValue(this.selectedPersona?.apodo)
      this.nacimientoControl.setValue(this.selectedPersona?.nacimiento != null ? new Date(this.selectedPersona?.nacimiento) : null);
      this.documentoControl.setValue(this.selectedPersona?.documento)
      this.emailControl.setValue(this.selectedPersona?.email)
      this.direccionControl.setValue(this.selectedPersona?.direccion)
      this.telefonoControl.setValue(this.selectedPersona?.telefono)
      this.socialMediaControl.setValue(this.selectedPersona?.socialMedia)
      this.ciudadIdControl.setValue(this.selectedPersona?.ciudad?.id)
      this.sexoControl.setValue(this.selectedPersona?.sexo)
    }
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('nombre', this.nombreControl)
    this.formGroup.addControl('apodo', this.apodoControl)
    this.formGroup.addControl('nacimiento', this.nacimientoControl)
    this.formGroup.addControl('documento', this.documentoControl)
    this.formGroup.addControl('email', this.emailControl)
    this.formGroup.addControl('direccion', this.direccionControl)
    this.formGroup.addControl('telefono', this.telefonoControl)
    this.formGroup.addControl('socialMedia', this.socialMediaControl)
    this.formGroup.addControl('ciudad', this.ciudadIdControl)
    this.formGroup.addControl('sexo', this.sexoControl)
  }

  onFechaNacimienntoChange(e) {
    let newDate = this.nacimientoControl.value;
    let minDate = new Date()
    minDate.setFullYear(this.maxDate.getFullYear() - 18)
    if (newDate > minDate) {
      this.dialogoService.confirm('Atención!!', `Realmente esta persona tiene ${this.maxDate.getFullYear() - newDate.getFullYear()} años?`).pipe(untilDestroyed(this)).subscribe(res => {
        if (!res) {
          this.nacimientoControl.setValue(null)
        }
      })
    }
  }

  onSave() {
    let persona = new Persona();
    Object.assign(persona, this.selectedPersona)
    persona.nombre = this.nombreControl.value;
    persona.apodo = this.apodoControl.value;
    persona.direccion = this.direccionControl.value;
    persona.documento = this.documentoControl.value;
    persona.email = this.emailControl.value;
    persona.nacimiento = this.nacimientoControl.value;
    persona.telefono = this.telefonoControl.value;
    persona.ciudad = this.selectedCiudad;
    persona.direccion = this.direccionControl.value;
    persona.sexo = this.sexoControl.value;

    this.personaService.onSavePersona(persona.toInput()).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPersona = res;
        this.matDialogRef.close(this.selectedPersona)
      }
    })
  }

  onCancel() {
    this.matDialogRef.close()
  }



}
