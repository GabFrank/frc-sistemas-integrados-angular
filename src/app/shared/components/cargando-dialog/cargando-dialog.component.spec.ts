import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargandoDialogComponent } from './cargando-dialog.component';

describe('CargandoDialogComponent', () => {
  let component: CargandoDialogComponent;
  let fixture: ComponentFixture<CargandoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CargandoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CargandoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
