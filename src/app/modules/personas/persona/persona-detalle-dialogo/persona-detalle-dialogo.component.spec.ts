import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PersonaDetalleDialogoComponent } from './persona-detalle-dialogo.component';

describe('PersonaDetalleDialogoComponent', () => {
  let component: PersonaDetalleDialogoComponent;
  let fixture: ComponentFixture<PersonaDetalleDialogoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonaDetalleDialogoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonaDetalleDialogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
