import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCategoriaObsDialogComponent } from './add-categoria-obs-dialog.component';

describe('AddCategoriaObsDialogComponent', () => {
  let component: AddCategoriaObsDialogComponent;
  let fixture: ComponentFixture<AddCategoriaObsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCategoriaObsDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCategoriaObsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
