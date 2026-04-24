import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideMiniVariantComponent } from './side-mini-variant.component';

describe('SideMiniVariantComponent', () => {
  let component: SideMiniVariantComponent;
  let fixture: ComponentFixture<SideMiniVariantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SideMiniVariantComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideMiniVariantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
