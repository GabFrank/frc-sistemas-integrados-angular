import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCajaSubcategoriaObsDialogComponent } from './add-caja-subcategoria-obs-dialog.component';

describe('AddCajaSubcategoriaObsDialogComponent', () => {
  let component: AddCajaSubcategoriaObsDialogComponent;
  let fixture: ComponentFixture<AddCajaSubcategoriaObsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCajaSubcategoriaObsDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCajaSubcategoriaObsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
