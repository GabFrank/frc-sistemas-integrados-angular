import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMotivoObsDialogComponent } from './add-motivo-obs-dialog.component';

describe('AddMotivoObsDialogComponent', () => {
  let component: AddMotivoObsDialogComponent;
  let fixture: ComponentFixture<AddMotivoObsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddMotivoObsDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMotivoObsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
