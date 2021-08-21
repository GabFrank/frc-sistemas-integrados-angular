import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { environment } from '../../../../../environments/environment';
import { FuncionarioInput } from '../funcionario-input.model';
import { FuncionarioService } from '../funcionario.service';

export interface Marcacion {
  id: number;
  sucursal: string;
  entrada: string;
  salida: string;
  fecha: string;
  descripcion: string;
}

export interface VehiculoSucursal {
  id: number;
  vehiculo: string;
  motivo: string;
  fecha: string;
  estado: string;
}

const ELEMENT_DATA_MARCACION: Marcacion[] = [
  {id: 6, sucursal: 'Rotonda', entrada: '08:16:00', salida: '16:01:00', fecha: '20-2-2021', descripcion: 'Autorizado por: Denis Piche - Gerente General'},
  {id: 5, sucursal: 'Rotonda', entrada: '08:22:00', salida: '16:02:00', fecha: '19-2-2021', descripcion: 'No avisado - Multa: 30.000 Gs'},
  {id: 4, sucursal: 'Rotonda', entrada: '08:2:00', salida: '16:10:00', fecha: '18-2-2021', descripcion: ''},
  {id: 3, sucursal: 'Central', entrada: '08:05:00', salida: '15:55:00', fecha: '17-2-2021', descripcion: ''},
  {id: 2, sucursal: 'Central', entrada: '07:58:00', salida: '16:35:00', fecha: '16-2-2021', descripcion: ''},
  {id: 1, sucursal: 'Rotonda', entrada: '08:01:00', salida: '15:10:00', fecha: '15-2-2021', descripcion: ''},
];

const ELEMENT_DATA_VEHICULO: VehiculoSucursal[] = [
  {id: 6, vehiculo: 'Fiat 1', motivo: 'Entrega mercadería', fecha: '10:05:00 19-2-2021', estado: 'OK'},
  {id: 5, vehiculo: 'Moto 23', motivo: 'Delivery', fecha: '13:55:00 18-2-2021', estado: 'OK'},
  {id: 4, vehiculo: 'Moto 22', motivo: 'Delivery', fecha: '9:33:00 17-2-2021', estado: 'OK'},
];

@Component({
  selector: 'app-funcionario',
  templateUrl: './funcionario.component.html',
  styleUrls: ['./funcionario.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class FuncionarioComponent implements OnInit {

  @Input() data;

  funcionarioInput: FuncionarioInput;
  formGroup: FormGroup;
  displayedColumnsTitleMarcacion: string[] = ['Sucursal', 'Entrada', 'Salida', 'Fecha'];
  displayedColumnsTitleVehiculos: string[] = ['Vehículo', 'Motivo', 'Fecha', 'Estado'];
  displayedColumnsMarcacion: string[] = ['sucursal', 'entrada', 'salida', 'fecha'];
  displayedColumnsVehiculos: string[] = ['vehiculo', 'motivo', 'fecha', 'estado'];
  dataSourceMarcacion = ELEMENT_DATA_MARCACION;
  dataSourceVehiculo = ELEMENT_DATA_VEHICULO;
  expandedElement: Marcacion | null;





  constructor(
    private service: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.createForm();
    console.log(this.data.tabData.nombrePersona)
    this.formGroup.get('nombrePersona').setValue('Gabriel Franco');
    this.formGroup.get('nombreCargo').setValue('Gerente de Sucursal');
    this.formGroup.get('nombreSucursal').setValue('Rotonda');
    this.formGroup.get('fechaIngreso').setValue('2019-10-18');
    this.formGroup.get('sueldo').setValue('3.000.000 GS');
    this.formGroup.get('supervisadoPor').setValue('Denis Piche');
    this.formGroup.get('credito').setValue('1.500.000 GS');
    this.formGroup.disable();
  }

  createForm(): void {
    this.formGroup = new FormGroup({
      nombrePersona: new FormControl(null),
      nombreCargo: new FormControl(null),
      nombreSucursal: new FormControl(null),
      credito: new FormControl(null),
      fechaIngreso: new FormControl(null),
      sueldo: new FormControl(null),
      fasePrueba: new FormControl(null),
      supervisadoPor: new FormControl(null),
      creadoEn: new FormControl(null),
      usuario: new FormControl(null)
    });
}
onSubmit(): void {
  // this.funcionarioInput = this.formGroup.value;
  if (this.data.tabData != null){
    this.funcionarioInput.id = this.data.tabData.id;
  }
  this.funcionarioInput.usuarioId = environment.usuario;
  this.service.onSave(this.funcionarioInput, this.data);
}


}
