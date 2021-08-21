import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ListUsuarioComponent } from './list-usuario.component';

describe('ListUsuarioComponent', () => {
  let component: ListUsuarioComponent;
  let fixture: ComponentFixture<ListUsuarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListUsuarioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
