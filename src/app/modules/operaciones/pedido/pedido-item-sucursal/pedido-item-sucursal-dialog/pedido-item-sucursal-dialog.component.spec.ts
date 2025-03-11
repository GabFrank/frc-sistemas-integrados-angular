import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoItemSucursalDialogComponent } from './pedido-item-sucursal-dialog.component';

describe('PedidoItemSucursalDialogComponent', () => {
  let component: PedidoItemSucursalDialogComponent;
  let fixture: ComponentFixture<PedidoItemSucursalDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PedidoItemSucursalDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidoItemSucursalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
