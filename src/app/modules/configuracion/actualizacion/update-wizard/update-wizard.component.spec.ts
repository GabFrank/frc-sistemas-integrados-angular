import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateWizardComponent } from './update-wizard.component';

describe('UpdateWizardComponent', () => {
  let component: UpdateWizardComponent;
  let fixture: ComponentFixture<UpdateWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateWizardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
