import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaletinComponent } from './maletin.component';

describe('MaletinComponent', () => {
  let component: MaletinComponent;
  let fixture: ComponentFixture<MaletinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaletinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaletinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
