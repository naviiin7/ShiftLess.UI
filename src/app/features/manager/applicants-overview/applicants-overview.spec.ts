import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantsOverview } from './applicants-overview';

describe('ApplicantsOverview', () => {
  let component: ApplicantsOverview;
  let fixture: ComponentFixture<ApplicantsOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicantsOverview],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicantsOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
