import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PersonaComponent } from './persona.component';

describe('PersonaComponent', () => {
  let component: PersonaComponent;
  let fixture: ComponentFixture<PersonaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PersonaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
