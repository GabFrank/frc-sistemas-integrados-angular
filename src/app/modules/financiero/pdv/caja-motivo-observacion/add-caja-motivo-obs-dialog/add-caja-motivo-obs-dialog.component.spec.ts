import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCajaMotivoObsDialogComponent } from './add-caja-motivo-obs-dialog.component';

describe('AddCajaMotivoObsDialogComponent', () => {
  let component: AddCajaMotivoObsDialogComponent;
  let fixture: ComponentFixture<AddCajaMotivoObsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCajaMotivoObsDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCajaMotivoObsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
