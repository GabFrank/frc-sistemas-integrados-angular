import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearCodigosDialogComponent } from './crear-codigos-dialog.component';

describe('CrearCodigosDialogComponent', () => {
  let component: CrearCodigosDialogComponent;
  let fixture: ComponentFixture<CrearCodigosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrearCodigosDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CrearCodigosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
