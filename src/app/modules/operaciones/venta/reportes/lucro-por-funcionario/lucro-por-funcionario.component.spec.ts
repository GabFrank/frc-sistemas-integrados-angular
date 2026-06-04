import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LucroPorFuncionarioComponent } from './lucro-por-funcionario.component';

describe('LucroPorFuncionarioComponent', () => {
  let component: LucroPorFuncionarioComponent;
  let fixture: ComponentFixture<LucroPorFuncionarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LucroPorFuncionarioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LucroPorFuncionarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
