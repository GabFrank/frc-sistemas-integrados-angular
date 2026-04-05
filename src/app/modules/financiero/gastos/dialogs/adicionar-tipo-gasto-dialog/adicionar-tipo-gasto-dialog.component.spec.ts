import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarTipoGastoDialogComponent } from './adicionar-tipo-gasto-dialog.component';

describe('AdicionarTipoGastoDialogComponent', () => {
  let component: AdicionarTipoGastoDialogComponent;
  let fixture: ComponentFixture<AdicionarTipoGastoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarTipoGastoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarTipoGastoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
