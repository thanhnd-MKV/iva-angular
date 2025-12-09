import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DashboardComponentShare} from '../../shared/dashboard/dashboard.component'; // Import the shared component

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
  imports: [
    CommonModule,
    DashboardComponentShare
  ],
})
export class DashboardComponent {
  title = 'dashboard-app';
}
