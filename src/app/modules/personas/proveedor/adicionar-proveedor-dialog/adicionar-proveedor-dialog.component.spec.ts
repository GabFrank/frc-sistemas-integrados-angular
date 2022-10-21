import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarProveedorDialogComponent } from './adicionar-proveedor-dialog.component';

describe('AdicionarProveedorDialogComponent', () => {
  let component: AdicionarProveedorDialogComponent;
  let fixture: ComponentFixture<AdicionarProveedorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarProveedorDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarProveedorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
