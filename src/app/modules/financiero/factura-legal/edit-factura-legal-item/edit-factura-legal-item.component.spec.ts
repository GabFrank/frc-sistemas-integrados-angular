import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFacturaLegalItemComponent } from './edit-factura-legal-item.component';

describe('EditFacturaLegalItemComponent', () => {
  let component: EditFacturaLegalItemComponent;
  let fixture: ComponentFixture<EditFacturaLegalItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditFacturaLegalItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditFacturaLegalItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
