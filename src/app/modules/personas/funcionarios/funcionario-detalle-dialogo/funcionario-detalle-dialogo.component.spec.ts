import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FuncionarioDetalleDialogoComponent } from './funcionario-detalle-dialogo.component';

describe('FuncionarioDetalleDialogoComponent', () => {
  let component: FuncionarioDetalleDialogoComponent;
  let fixture: ComponentFixture<FuncionarioDetalleDialogoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FuncionarioDetalleDialogoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FuncionarioDetalleDialogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
