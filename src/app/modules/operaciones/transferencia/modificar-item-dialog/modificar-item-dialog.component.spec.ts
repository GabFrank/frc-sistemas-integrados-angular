import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificarItemDialogComponent } from './modificar-item-dialog.component';

describe('ModificarItemDialogComponent', () => {
  let component: ModificarItemDialogComponent;
  let fixture: ComponentFixture<ModificarItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificarItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
