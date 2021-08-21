import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditProveedorComponent } from './edit-proveedor.component';

describe('EditProveedorComponent', () => {
  let component: EditProveedorComponent;
  let fixture: ComponentFixture<EditProveedorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditProveedorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
