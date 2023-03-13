import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFacturaLegalDialogComponent } from './add-factura-legal-dialog.component';

describe('AddFacturaLegalDialogComponent', () => {
  let component: AddFacturaLegalDialogComponent;
  let fixture: ComponentFixture<AddFacturaLegalDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddFacturaLegalDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFacturaLegalDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
