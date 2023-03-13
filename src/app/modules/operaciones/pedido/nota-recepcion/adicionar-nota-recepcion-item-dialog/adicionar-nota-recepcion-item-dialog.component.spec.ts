import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarNotaRecepcionItemDialogComponent } from './adicionar-nota-recepcion-item-dialog.component';

describe('AdicionarNotaRecepcionItemDialogComponent', () => {
  let component: AdicionarNotaRecepcionItemDialogComponent;
  let fixture: ComponentFixture<AdicionarNotaRecepcionItemDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarNotaRecepcionItemDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarNotaRecepcionItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
