import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddVentaCreditoDialogComponent } from './add-venta-credito-dialog.component';

describe('AddVentaCreditoDialogComponent', () => {
  let component: AddVentaCreditoDialogComponent;
  let fixture: ComponentFixture<AddVentaCreditoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddVentaCreditoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddVentaCreditoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
