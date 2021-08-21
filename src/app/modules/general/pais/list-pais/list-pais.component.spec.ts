import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListPaisComponent } from './list-pais.component';

describe('ListPaisComponent', () => {
  let component: ListPaisComponent;
  let fixture: ComponentFixture<ListPaisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListPaisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListPaisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
