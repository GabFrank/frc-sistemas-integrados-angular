import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { DeliveryPreciosGQL } from '../../general/barrio/graphql/precioDeliverySearchByPrecio';
import { Contacto } from '../../general/contactos/contacto';
import { ContactosSearchByTelefonoOrNombreGQL } from '../../general/contactos/graphql/contactoPorTelefono';
import { PrecioDelivery } from '../../operaciones/delivery/precio-delivery.model';
import { Cliente } from '../../personas/clientes/cliente.model';
import { ClientesSearchByPersonaGQL } from '../../personas/clientes/graphql/clienteSearchByPersona';
import { ClientesSearchByPersonaIdGQL } from '../../personas/clientes/graphql/clienteSearchByPersonaId';
import { ClientesSearchByTelefonoGQL } from '../../personas/clientes/graphql/clienteSearchByTelefono';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.css']
})
export class RestaurantComponent implements OnInit {

  @ViewChild('autoBuscarClienteInput', { static: false, read: MatAutocompleteTrigger }) matBuscarClienteTrigger: MatAutocompleteTrigger;
  @ViewChild('autoBuscarClienteInput', { static: false }) autoBuscarClienteInput: ElementRef;
  @ViewChild('autoClienteInput', { static: false, read: MatAutocompleteTrigger }) matClienteTrigger: MatAutocompleteTrigger;
  @ViewChild('autoClienteInput', { static: false }) autoClienteInput: ElementRef;
  @ViewChild('autoTelefonoInput', { static: false, read: MatAutocompleteTrigger }) matTelefonoTrigger: MatAutocompleteTrigger;
  @ViewChild('autoTelefonoInput', { static: false }) autoTelefonoInput: ElementRef;

  formGroup: FormGroup;
  dateNow;
  clientes: Cliente[];
  contactos: Contacto[];
  deliveryPrecios: PrecioDelivery[];
  selectedCliente: Cliente;
  selectedContacto: Contacto;
  buscarCliente = new FormControl();
  clienteNotFound = false;

  constructor(
    private clienteSearchByPersona: ClientesSearchByPersonaGQL,
    private clienteSearchByTelefono: ClientesSearchByTelefonoGQL,
    private precioDeliveryByPrecio: DeliveryPreciosGQL,
    private contactoSearch: ContactosSearchByTelefonoOrNombreGQL,
    private clienteSearchByPersonaId: ClientesSearchByPersonaIdGQL
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.dateNow = new Date();
    this.formGroup.get('delivery').setValue(false);
    this.formGroup.get('mesa').setValue(true);
    this.formGroup.get('retirarEnLocal').setValue(false);
    this.formGroup.get('horaAgend').setValue(this.dateNow);
    this.precioDeliveryByPrecio.fetch().pipe(untilDestroyed(this)).subscribe(data=>{
      this.deliveryPrecios = data.data.deliveryPrecios;
      this.formGroup.get('precioDelivery').setValue(this.deliveryPrecios[1].id);
    });
  }

  onSubmit() {

  }

  createForm(): void {
    this.formGroup = new FormGroup({
      mesa: new FormControl(null),
      delivery: new FormControl(null),
      cliente: new FormControl(null),
      telefono: new FormControl(null),
      comanda: new FormControl(null),
      entregador: new FormControl(null),
      retirarEnLocal: new FormControl(null),
      agendado: new FormControl(null),
      horaAgend: new FormControl(null),
      ubicacion: new FormControl(null),
      precioDelivery: new FormControl(null),
      descuento: new FormControl(null)
    });
    this.formGroup.addControl('buscarCliente', this.buscarCliente);
  }

  onTipoVentaChange(tipo) {
    switch (tipo) {
      case 'delivery':
        if (this.formGroup.get('delivery').value == true) {
          this.formGroup.get('retirarEnLocal').setValue(false);
          this.formGroup.get('mesa').setValue(false);
        } else if (this.formGroup.get('delivery').value == false) {
          this.formGroup.get('retirarEnLocal').setValue(false);
          this.formGroup.get('mesa').setValue(true);
        }
        break;
      case 'retirarEnLocal':
        if (this.formGroup.get('retirarEnLocal').value === true) {
          this.formGroup.get('delivery').setValue(false);
          this.formGroup.get('mesa').setValue(false);
        } else if (this.formGroup.get('retirarEnLocal').value === false) {
          this.formGroup.get('delivery').setValue(false);
          this.formGroup.get('mesa').setValue(true);
        }
        break;
      case 'mesa':
        if (this.formGroup.get('mesa').value === true) {
          this.formGroup.get('retirarEnLocal').setValue(false);
          this.formGroup.get('delivery').setValue(false);
        } else if (this.formGroup.get('mesa').value === false) {
          this.formGroup.get('retirarEnLocal').setValue(false);
          this.formGroup.get('delivery').setValue(true);
        }
        break;
      default:
        break;
    }
  }

  onClienteSearch(){
    let texto: string = this.buscarCliente.value;
    if(texto.length > 0){
      this.contactoSearch.fetch(
        {
          texto: this.buscarCliente.value
        },
        {
          fetchPolicy: 'no-cache'
        }
      ).pipe(untilDestroyed(this)).subscribe(data=>{
        this.contactos = data.data.contactos;
        if(this.contactos.length == 1){
          this.selectedContacto = this.contactos[0];
          setTimeout(() => {
            this.clienteSearchByPersonaId.fetch(
              {
                id: this.contactos[0].persona.id
              },
              {
                fetchPolicy: 'no-cache'
              }
            ).pipe(untilDestroyed(this)).subscribe(data=>{
              this.selectedCliente = data.data.cliente;
              if(this.selectedCliente!=null){
                this.buscarCliente.setValue(this.contactos[0].id);
              }
            });
            this.formGroup.get('telefono').setValue(this.contactos[0].telefono);
          }, 1000);
        } else if(this.contactos.length == 0){
          setTimeout(() => {
            this.clienteNotFound = true;
            let newContacto = new Contacto();
            // newContacto
            // this.formGroup.get('telefono').setValue()
          }, 1000);
        }
      })
    }
  }

  onClienteSelect(e: MatAutocompleteSelectedEvent){
  }

  displayCliente(value: number){
    let res = value ? this.contactos.find(_ => _.id === value) : undefined;
    return res ? res.persona.nombre : undefined;
  }

}
