import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { PersonaInput } from './persona-input.model';
import { Apollo } from 'apollo-angular';
import { TabService } from '../../../../layouts/tab/tab.service';
import { PersonaService } from '../persona.service';
import { environment } from '../../../../../environments/environment';


@Component({
  selector: 'app-persona',
  templateUrl: './persona.component.html',
  styleUrls: ['./persona.component.scss']
})
export class PersonaComponent implements OnInit {

  @Input() data;

  personaInput: PersonaInput;
  formGroup: FormGroup;
  ciudadFilteredOptions: Observable<string[]>;
  sexoFilteredOptions: Observable<string[]>;
  ciudad = new FormControl();
  sexo = new FormControl();

  titleAlert = 'Este campo es necesario.';


  ciudades: string[] = [
    'Salto del Guairá',
    'Paloma',
    'Katuete',
    'Curuguaty',
    'Puene Kyhá'
  ];

  sexos: string[] = [
    'Masculino',
    'Femenino',
    'Otro'
  ];

  constructor(private apollo: Apollo,
              private tabService: TabService,
              private service: PersonaService
              ) { }

  ngOnInit(): void {
    this.createForm();
    if (this.data?.tabData != undefined) {
    }
  }

  private _filter(value: string, opciones: string[]): string[] {
    const filterValue = value.toLowerCase();
    return opciones.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      apodo: new FormControl(null),
      nacimiento: new FormControl(null),
      documento: new FormControl(null, Validators.required),
      email: new FormControl(null, Validators.email),
      direccion: new FormControl(null),
      telefono: new FormControl(null),
      socialMedia: new FormControl(null)
    });

    this.ciudadFilteredOptions = this.ciudad.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.ciudades))
    );

    this.sexoFilteredOptions = this.sexo.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.sexos))
    );

    this.formGroup.addControl('ciudad', this.ciudad);
    this.formGroup.addControl('sexo', this.sexo);
  }

  verificarFacebook(): void {
    const socialMediaUser = this.formGroup.controls['socialMedia'].value;
    if (socialMediaUser != null && this.formGroup.controls['socialMedia'].value != '') {
      window.open(`http://facebook.com/${socialMediaUser}`, '_blank');
    }
  }

  onSubmit(): void {
    this.personaInput = this.formGroup.value;
    if (this.data.tabData != null){
      this.personaInput.id = this.data.tabData.id;
    }
    this.personaInput.usuarioId = environment.usuario;
    // this.service.onSave(this.personaInput, this.data);
  }

}
