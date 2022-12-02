import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from "@angular/router";
import {ViewLocationComponent} from "./view-location/view-location.component";
import {ItemListComponent} from "./items/item-list.component";
import {ViewHomeComponent} from "./view-home/view-home.component";

const routes: Routes = [
  {path: 'home', component: ViewHomeComponent},
  {path: 'dashboard', component: ViewLocationComponent},
  {path: 'list', component: ItemListComponent},
  {path: '', redirectTo: 'home', pathMatch: "full"}
];

@NgModule({
  declarations: [],
  imports: [
    [RouterModule.forRoot(routes)]
  ],
  exports: [
    [RouterModule]
  ]
})
export class AppRoutingModule { }
