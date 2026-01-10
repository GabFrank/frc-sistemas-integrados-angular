import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IngresoGastoComponent } from './ingreso-gasto.component';

describe('IngresoGastoComponent', () => {
  let component: IngresoGastoComponent;
  let fixture: ComponentFixture<IngresoGastoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IngresoGastoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IngresoGastoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
