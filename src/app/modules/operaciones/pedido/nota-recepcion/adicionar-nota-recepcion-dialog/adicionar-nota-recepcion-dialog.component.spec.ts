import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarNotaRecepcionDialogComponent } from './adicionar-nota-recepcion-dialog.component';

describe('AdicionarNotaRecepcionDialogComponent', () => {
  let component: AdicionarNotaRecepcionDialogComponent;
  let fixture: ComponentFixture<AdicionarNotaRecepcionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarNotaRecepcionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarNotaRecepcionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
