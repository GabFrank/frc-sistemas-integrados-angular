import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearCambioDialogComponent } from './crear-cambio-dialog.component';

describe('CrearCambioDialogComponent', () => {
  let component: CrearCambioDialogComponent;
  let fixture: ComponentFixture<CrearCambioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrearCambioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearCambioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
