import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCajaCategoriaObsDialogComponent } from './add-caja-categoria-obs-dialog.component';

describe('AddCajaCategoriaObsDialogComponent', () => {
  let component: AddCajaCategoriaObsDialogComponent;
  let fixture: ComponentFixture<AddCajaCategoriaObsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCajaCategoriaObsDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCajaCategoriaObsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
