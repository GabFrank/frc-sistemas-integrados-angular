import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListGpsComponent } from './list-gps.component';

describe('ListGpsComponent', () => {
  let component: ListGpsComponent;
  let fixture: ComponentFixture<ListGpsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListGpsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListGpsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
