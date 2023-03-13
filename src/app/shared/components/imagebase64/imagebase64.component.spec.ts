import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Imagebase64Component } from './imagebase64.component';

describe('Imagebase64Component', () => {
  let component: Imagebase64Component;
  let fixture: ComponentFixture<Imagebase64Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Imagebase64Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Imagebase64Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
