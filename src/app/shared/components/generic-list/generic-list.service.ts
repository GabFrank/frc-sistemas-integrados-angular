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

export abstract class GenericListService implements GenericListInterface {

  datos = [];
  dsData;
  dataSource = null;
  component;
  parentComponent;
  entityQuery;
  allEntitiesQuery;
  deleteQuery;
  dataRangeQuery;
  searchQuery;
  saveQuery;
  preTitle;
  newTitle;
  editTitle;
  deleteTitle;
  lastText;
  lastQuery;
  lastSort;
  isDateSort = false;

  constructor(
    protected apollo: Apollo,
    protected tabService: TabService,
    protected dialogoService: DialogosService
  ) { }

  public datosSub = new BehaviorSubject<any>(this.dataSource);

  searchQuerySubscription: Subscription;

  add(component, newTabTitle, parentComponent): void {
    this.tabService.addTab(new Tab(component, newTabTitle, null, parentComponent));
  }

  reSearch(text?: string): void {
    console.log('haciendo research', text);
    this.onSearch(text ?? this.lastText, this.lastQuery, this.lastSort);
  }

  onSave(input, tab?): void {
     this.apollo.mutate({
      mutation: this.saveQuery,
      variables: {
        entity: input
      }
    }).subscribe((data) => {
      if(tab){
        this.tabService.removeTab(tab.id - 1);
        this.dataSource = [];
        this.reSearch(data.data['data'][`${this.editTitle}`]);
      }
    });
  }

  onDelete(e, deleteTitle, deleteQuery): void {
    const nombre = `Eliminar a ${e[`${deleteTitle}`]}?`;
    this.dialogoService.confirm(nombre, 'Esta acción no se puede deshacer', null, null, true).pipe(
      map(res => {
        if (res === true) {
          this.apollo.mutate({
            mutation: deleteQuery,
            variables: {
              id: e.id
            }
          }).subscribe((data) => {
            if (data.data) {
              this.dsData = this.dataSource.data;
              const itemIndex = this.dsData.findIndex(obj => obj['id'] === e.id);
              this.dsData.splice(itemIndex, 1);
              this.dataSource.data = this.dsData;
              this.datosSub.next(this.dataSource);
            }
          });
        }
      })).subscribe(
        res => {
          console.log(res);
        }
      );
  }

  onAllEntitiesQuery(query): void {
    this.apollo.query<any>({
      query: query,
      fetchPolicy: 'no-cache'
    }).subscribe(({ data }) => {
      this.datos = data.data;
      this.dataSource = new MatTableDataSource<any>(this.datos);
      this.datosSub.next(this.dataSource);
      console.log(data)
    });
  }

  onDateRangeSeach(start, end?, query?){
    console.log(start)
    this.apollo.query<any>({
      query: this.dataRangeQuery,
      fetchPolicy: 'no-cache',
      variables: {
        start: start,
        end: end
      }
    }).subscribe(({ data }) => {
      this.datos = data.data;
      this.dataSource = new MatTableDataSource<any>(this.datos);
      this.datosSub.next(this.dataSource);
      console.log(data)
    });
  }


  onSearch(text, searchQuery, sort, id?): void {
    this.lastText = text;
    this.lastQuery = searchQuery;
    this.lastSort = sort;
    console.log(text, id)
    if (text.length > 0) {
      if(id!=null){
        this.apollo
        .query<any>({
          query: searchQuery,
          fetchPolicy: 'no-cache',
          variables: {
            id,
            texto: text,
          },
        })
        .subscribe(({ data }) => {
          console.log(data.data)
          this.datos = data.data;
          this.dataSource = new MatTableDataSource<any>(this.datos);
          this.dataSource.sort = sort;
          this.datosSub.next(this.dataSource);
          data;
        });
      } else {
        this.apollo
        .query<any>({
          query: searchQuery,
          fetchPolicy: 'no-cache',
          variables: {
            texto: text,
          },
        })
        .subscribe(({ data }) => {
          this.datos = data.data;
          this.dataSource = new MatTableDataSource<any>(this.datos);
          this.dataSource.sort = sort;
          this.datosSub.next(this.dataSource);
          data;
        });
      }
    } else {
      this.dataSource = [];
      this.datosSub.next(this.dataSource);
    }
  }

  searchByText(text, searchQuery) {
    return this.apollo
      .watchQuery<any>({
        query: searchQuery,
        fetchPolicy: 'no-cache',
        variables: {
          texto: text,
        }
      });
  }

  findById(id, entityQuery){
    return this.apollo
      .query<any>({
        query: entityQuery,
        fetchPolicy: 'no-cache',
        variables: {
          id
        }
      });
  }

  onEdit(obj, query, component: Type<any>, editTabTitle: string, parentComponent, preTitle?: string,): void {
    let entity: any;
    this.searchQuerySubscription = this.apollo
      .watchQuery<any>({
        query,
        variables: {
          id: obj.id,
        },
      })
      .valueChanges.subscribe(({ data }) => {
        entity = data.data;
        console.log(entity[`${editTabTitle}`])
        this.tabService.addTab(new Tab(component, (preTitle ? preTitle + ' ': '') + entity[`${editTabTitle}`], entity, parentComponent));
      });
  }
  onDestroy(): void {
    this.dataSource = [];
    this.datosSub.next(this.dataSource);
  }
}


