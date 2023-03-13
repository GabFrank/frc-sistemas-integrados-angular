import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateInventarioDialogComponent } from './create-inventario-dialog.component';

describe('CreateInventarioDialogComponent', () => {
  let component: CreateInventarioDialogComponent;
  let fixture: ComponentFixture<CreateInventarioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateInventarioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateInventarioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
