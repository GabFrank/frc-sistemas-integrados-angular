import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelLaterialInvisibleComponent } from './panel-laterial-invisible.component';

describe('PanelLaterialInvisibleComponent', () => {
  let component: PanelLaterialInvisibleComponent;
  let fixture: ComponentFixture<PanelLaterialInvisibleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanelLaterialInvisibleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelLaterialInvisibleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
