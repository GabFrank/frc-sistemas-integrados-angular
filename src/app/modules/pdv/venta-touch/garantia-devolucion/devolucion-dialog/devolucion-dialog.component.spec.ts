import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevolucionDialogComponent } from './devolucion-dialog.component';

describe('DevolucionDialogComponent', () => {
  let component: DevolucionDialogComponent;
  let fixture: ComponentFixture<DevolucionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevolucionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevolucionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
