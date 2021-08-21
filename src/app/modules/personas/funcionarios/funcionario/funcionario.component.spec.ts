import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FuncionarioComponent } from './funcionario.component';

describe('FuncionarioComponent', () => {
  let component: FuncionarioComponent;
  let fixture: ComponentFixture<FuncionarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FuncionarioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FuncionarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
