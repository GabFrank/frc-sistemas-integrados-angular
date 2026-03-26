import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BienesDashboardComponent } from './bienes-dashboard.component';

describe('BienesDashboardComponent', () => {
  let component: BienesDashboardComponent;
  let fixture: ComponentFixture<BienesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BienesDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BienesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
