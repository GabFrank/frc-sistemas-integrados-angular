import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonasDashboardComponent } from './personas-dashboard.component';

describe('PersonasDashboardComponent', () => {
  let component: PersonasDashboardComponent;
  let fixture: ComponentFixture<PersonasDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonasDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonasDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
