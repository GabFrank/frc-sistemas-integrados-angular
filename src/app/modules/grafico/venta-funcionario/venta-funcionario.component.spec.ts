import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaFuncionarioComponent } from './venta-funcionario.component';

describe('VentaFuncionarioComponent', () => {
  let component: VentaFuncionarioComponent;
  let fixture: ComponentFixture<VentaFuncionarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VentaFuncionarioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VentaFuncionarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
