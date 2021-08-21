import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditPedidoComponent } from './edit-pedido.component';

describe('EditPedidoComponent', () => {
  let component: EditPedidoComponent;
  let fixture: ComponentFixture<EditPedidoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditPedidoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
