import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitarContrasenaDialogComponent } from './digitar-contrasena-dialog.component';

describe('DigitarContrasenaDialogComponent', () => {
  let component: DigitarContrasenaDialogComponent;
  let fixture: ComponentFixture<DigitarContrasenaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DigitarContrasenaDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitarContrasenaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
