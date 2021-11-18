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

@Component({
  selector: 'app-adicionar-persona-dialog',
  templateUrl: './adicionar-persona-dialog.component.html',
  styleUrls: ['./adicionar-persona-dialog.component.scss']
})
export class AdicionarPersonaDialogComponent implements OnInit {

  idControl = new FormControl()
  nombreControl = new FormControl(null,Validators.required)
  apodoControl = new FormControl(null,)
  nacimientoControl  = new FormControl()
  documentoControl = new FormControl(null, Validators.required)
  emailControl = new FormControl() 
  direccionControl = new FormControl()
  telefonoControl = new FormControl(null,[Validators.required, Validators.minLength(10)])
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
    if(data?.persona != null){
      this.selectedPersona = data.persona;
    }
   }

  ngOnInit(): void {
    this.createForm()
  }

  createForm(){
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

  onFechaNacimienntoChange(e){
    let newDate = this.nacimientoControl.value;
    let minDate = new Date()
    minDate.setFullYear(this.maxDate.getFullYear()-18)
    if(newDate > minDate){
      this.dialogoService.confirm('Atención!!', `Realmente esta persona tiene ${this.maxDate.getFullYear() - newDate.getFullYear()} años?`).subscribe(res => {
        if(!res){
          this.nacimientoControl.setValue(null)
        }
      })
    }
  }

  onSave(){
    let input = new PersonaInput;
    if(this.selectedPersona!=null){
      input.id = this.selectedPersona.id
      input.creadoEn = this.selectedPersona.creadoEn;
      input.usuarioId = this.selectedPersona?.usuario.id
    }
    input.nombre = this.nombreControl.value;
    input.apodo = this.apodoControl.value;
    input.direccion = this.direccionControl.value;
    input.documento = this.documentoControl.value;
    input.email = this.emailControl.value;
    input.nacimiento = this.nacimientoControl.value;
    input.telefono = this.telefonoControl.value;
    input.ciudadId = this.selectedCiudad?.id;
    input.direccion = this.direccionControl.value;
    input.sexo = this.sexoControl.value;

    this.personaService.onSavePersona(input).subscribe(res => {
      if(res!=null){
        this.selectedPersona = res;
        this.matDialogRef.close(this.selectedPersona)
      }
    })
  }

  onCancel(){
    this.matDialogRef.close()
  }



}
