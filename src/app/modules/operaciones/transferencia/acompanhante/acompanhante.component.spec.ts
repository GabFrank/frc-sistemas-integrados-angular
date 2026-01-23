import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcompanhanteComponent } from './acompanhante.component';

describe('AcompanhanteComponent', () => {
  let component: AcompanhanteComponent;
  let fixture: ComponentFixture<AcompanhanteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AcompanhanteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcompanhanteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
