import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCajaObservacionDialogComponent } from './add-caja-observacion-dialog.component';

describe('AddCajaObservacionDialogComponent', () => {
  let component: AddCajaObservacionDialogComponent;
  let fixture: ComponentFixture<AddCajaObservacionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCajaObservacionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCajaObservacionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
