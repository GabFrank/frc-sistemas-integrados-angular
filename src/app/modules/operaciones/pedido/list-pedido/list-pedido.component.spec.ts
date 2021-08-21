import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListPedidoComponent } from './list-pedido.component';

describe('ListPedidoComponent', () => {
  let component: ListPedidoComponent;
  let fixture: ComponentFixture<ListPedidoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListPedidoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
