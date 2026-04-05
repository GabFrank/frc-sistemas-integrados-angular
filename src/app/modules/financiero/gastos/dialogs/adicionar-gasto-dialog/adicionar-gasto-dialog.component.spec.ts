import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarGastoDialogComponent } from './adicionar-gasto-dialog.component';

describe('AdicionarGastoDialogComponent', () => {
  let component: AdicionarGastoDialogComponent;
  let fixture: ComponentFixture<AdicionarGastoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarGastoDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarGastoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
