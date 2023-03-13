import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPreRegistroFuncionarioComponent } from './list-pre-registro-funcionario.component';

describe('ListPreRegistroFuncionarioComponent', () => {
  let component: ListPreRegistroFuncionarioComponent;
  let fixture: ComponentFixture<ListPreRegistroFuncionarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListPreRegistroFuncionarioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPreRegistroFuncionarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
