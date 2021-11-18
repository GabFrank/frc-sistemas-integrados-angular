import { Injectable, Type, Component, Optional } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Subscription, BehaviorSubject } from 'rxjs';
import { DialogosService } from '../dialogos/dialogos.service';
import { map } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { GenericListInterface } from './generic-list-interface';
import { formatDate } from '@angular/common';
import { TabService } from '../../../layouts/tab/tab.service';
import { Tab } from '../../../layouts/tab/tab.model';

export abstract class GenericListService {

  constructor(

  ) { }

  
}


