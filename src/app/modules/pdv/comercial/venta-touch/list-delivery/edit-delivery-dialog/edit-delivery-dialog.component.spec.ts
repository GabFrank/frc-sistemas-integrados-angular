import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDeliveryDialogComponent } from './edit-delivery-dialog.component';

describe('EditDeliveryDialogComponent', () => {
  let component: EditDeliveryDialogComponent;
  let fixture: ComponentFixture<EditDeliveryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditDeliveryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDeliveryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
