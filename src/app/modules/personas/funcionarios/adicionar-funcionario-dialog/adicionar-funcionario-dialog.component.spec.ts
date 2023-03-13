import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarFuncionarioDialogComponent } from './adicionar-funcionario-dialog.component';

describe('AdicionarFuncionarioDialogComponent', () => {
  let component: AdicionarFuncionarioDialogComponent;
  let fixture: ComponentFixture<AdicionarFuncionarioDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdicionarFuncionarioDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdicionarFuncionarioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
