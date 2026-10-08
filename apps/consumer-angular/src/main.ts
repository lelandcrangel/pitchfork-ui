import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

// Stylesheets are declared in angular.json rather than imported here, which is
// how an Angular application loads them -- and a second consumer path for the
// token layer, since the React app imports it from JavaScript.
void bootstrapApplication(AppComponent);
