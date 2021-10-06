import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VizualizarImagenDialogComponent } from './vizualizar-imagen-dialog.component';

describe('VizualizarImagenDialogComponent', () => {
  let component: VizualizarImagenDialogComponent;
  let fixture: ComponentFixture<VizualizarImagenDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VizualizarImagenDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VizualizarImagenDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
