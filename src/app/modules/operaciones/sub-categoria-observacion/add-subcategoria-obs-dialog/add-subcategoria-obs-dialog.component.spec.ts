import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSubcategoriaObsDialogComponent } from './add-subcategoria-obs-dialog.component';

describe('AddSubcategoriaObsDialogComponent', () => {
  let component: AddSubcategoriaObsDialogComponent;
  let fixture: ComponentFixture<AddSubcategoriaObsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddSubcategoriaObsDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSubcategoriaObsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
