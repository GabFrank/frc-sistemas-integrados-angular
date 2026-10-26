import { discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { AddVentaCreditoDialogComponent } from './add-venta-credito-dialog.component';

/**
 * Elegir el cliente no puede borrarlo. Al elegirlo de la lista, mat-autocomplete escribe el cliente en el control
 * marcándolo dirty y recién después emite optionSelected; antes eso disparaba el «editar invalida la selección» de
 * #390 y el diálogo quedaba sin cliente ni saldo: «No posee saldo suficiente» con 8.416.000 disponibles (15/10).
 */
describe('AddVentaCreditoDialogComponent', () => {
  const cliente: any = { id: '798', saldo: 8416000, credito: 10000000, persona: { id: '934', nombre: 'FARMACIA FRANCO AREVALOS S.A' } };
  const otro: any = { id: '832', saldo: 0, credito: 0, persona: { id: '968', nombre: 'FRANCO AREVALOS SOCIEDAD ANONIMA' } };
  /** El central responde después de que onSearch volvió, como Apollo: nunca dentro de la misma llamada. */
  const RED_MS = 100;
  const respuesta = (valor) => of(valor).pipe(delay(RED_MS));

  let component: AddVentaCreditoDialogComponent;
  let notificacion: jasmine.SpyObj<any>;
  let clienteService: jasmine.SpyObj<any>;

  beforeEach(() => {
    notificacion = jasmine.createSpyObj('NotificacionSnackbarService', ['openWarn']);
    clienteService = jasmine.createSpyObj('ClienteService', ['onGetByPersonaIdFromServer', 'onSearchFromServer']);
    clienteService.onGetByPersonaIdFromServer.and.returnValue(respuesta(cliente));
    clienteService.onSearchFromServer.and.returnValue(respuesta([]));
    component = new AddVentaCreditoDialogComponent(
      { valor: 12000 }, null, clienteService, notificacion, null, null, null);
    component.nombreInput = { nativeElement: { select: () => { }, focus: () => { } } } as any;
    component.ngOnInit();
  });

  /** Lo que hace MatAutocompleteTrigger._setValueAndClose: _onChange (dirty + valueChanges) y después optionSelected. */
  function elegirDeLaLista(c) {
    component.nombreClienteControl.markAsDirty();
    component.nombreClienteControl.setValue(c);
    component.onClienteSelect(c);
  }

  it('elegido de la lista queda seleccionado con su saldo y sin aviso', fakeAsync(() => {
    component.nombreClienteControl.markAsDirty();
    component.nombreClienteControl.setValue('FARMACIA FRANCO');
    tick(1000 + RED_MS);

    elegirDeLaLista(cliente);
    flush();
    discardPeriodicTasks();

    expect(component.selectedCliente).toBe(cliente);
    expect(component.saldoEnCredito).toBe(8416000);
    expect(notificacion.openWarn).not.toHaveBeenCalled();
    // La búsqueda pendiente por el texto escrito no puede pisar la elección
    expect(clienteService.onSearchFromServer).toHaveBeenCalledTimes(1);
  }));

  it('buscado por número queda seleccionado con su saldo y sin aviso', fakeAsync(() => {
    component.nombreClienteControl.markAsDirty();
    component.nombreClienteControl.setValue('934');
    tick(1000 + RED_MS);

    expect(clienteService.onGetByPersonaIdFromServer).toHaveBeenCalledWith('934', jasmine.anything());
    expect(component.selectedCliente).toBe(cliente);
    expect(component.saldoEnCredito).toBe(8416000);
    expect(notificacion.openWarn).not.toHaveBeenCalled();
    flush();
    discardPeriodicTasks();
    expect(component.selectedCliente).toBe(cliente);
  }));

  it('una búsqueda que ya salió no cambia el cliente elegido de la lista', fakeAsync(() => {
    clienteService.onSearchFromServer.and.returnValue(respuesta([otro]));
    component.nombreClienteControl.markAsDirty();
    component.nombreClienteControl.setValue('FRANCO');
    tick(1000); // la búsqueda salió y todavía no volvió

    elegirDeLaLista(cliente);
    flush();
    discardPeriodicTasks();

    expect(component.selectedCliente).toBe(cliente);
    expect(component.saldoEnCredito).toBe(8416000);
    expect(notificacion.openWarn).not.toHaveBeenCalled();
  }));

  it('editar el texto después de elegir sigue invalidando la selección (#390)', fakeAsync(() => {
    elegirDeLaLista(cliente);
    tick(1000);

    component.nombreClienteControl.markAsDirty();
    component.nombreClienteControl.setValue('OTRO');

    expect(component.selectedCliente).toBeNull();
    expect(component.saldoEnCredito).toBeNull();
    flush();
    discardPeriodicTasks();
  }));

  it('con saldo menor al total avisa y no habilita la confirmación', fakeAsync(() => {
    elegirDeLaLista({ ...cliente, saldo: 5000 });
    flush();
    discardPeriodicTasks();

    expect(notificacion.openWarn).toHaveBeenCalledWith('No posee saldo suficiente. Verifique en el aplicativo.');
    expect(component.total > component.saldoEnCredito).toBeTrue();
  }));
});
