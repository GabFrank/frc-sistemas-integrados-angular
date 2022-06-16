import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FuncionarioWizardComponent } from './funcionario-wizard.component';

describe('FuncionarioWizardComponent', () => {
  let component: FuncionarioWizardComponent;
  let fixture: ComponentFixture<FuncionarioWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FuncionarioWizardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FuncionarioWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
