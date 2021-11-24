import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancieroDashboardComponent } from './financiero-dashboard.component';

describe('FinancieroDashboardComponent', () => {
  let component: FinancieroDashboardComponent;
  let fixture: ComponentFixture<FinancieroDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinancieroDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinancieroDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
