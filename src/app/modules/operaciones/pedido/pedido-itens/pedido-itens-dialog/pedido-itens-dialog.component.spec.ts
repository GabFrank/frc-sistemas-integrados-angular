import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoItensDialogComponent } from './pedido-itens-dialog.component';

describe('PedidoItensDialogComponent', () => {
  let component: PedidoItensDialogComponent;
  let fixture: ComponentFixture<PedidoItensDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PedidoItensDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidoItensDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
