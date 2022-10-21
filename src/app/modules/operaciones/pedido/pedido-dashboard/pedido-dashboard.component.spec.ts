import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoDashboardComponent } from './pedido-dashboard.component';

describe('PedidoDashboardComponent', () => {
  let component: PedidoDashboardComponent;
  let fixture: ComponentFixture<PedidoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PedidoDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidoDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
