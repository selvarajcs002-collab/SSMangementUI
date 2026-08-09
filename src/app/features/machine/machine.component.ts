import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

@Component({
  selector: 'app-machine',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './machine.component.html',
  styleUrls: ['./machine.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineComponent {
  isSidebarCollapsed = signal(false);
  isMobileMenuOpen = signal(false);

  menuSections = [
    {
      title: 'MACHINE OPERATIONS',
      items: [
        { label: 'Machine Dashboard', route: 'dashboard', icon: 'dashboard' },
        { label: 'Register Machine', route: 'register', icon: 'add_circle' },
        { label: 'Machine UP || DOWN', route: 'operator-mapping', icon: 'settings_power' },
        { label: 'Expected Output', route: 'expected-output', icon: 'track_changes' },
        { label: 'Machine Production', route: 'production', icon: 'factory' }
      ]
    },
    {
      title: 'MAINTENANCE',
      items: [
        { label: 'Service Details', route: 'service-details', icon: 'build' },
        { label: 'Predictive Maintenance', route: 'predictive-maintenance', icon: 'auto_fix_high' },
        { label: 'Maintenance Scheduler', route: 'maintenance-scheduler', icon: 'calendar_today' },
        { label: 'Breakdown History', route: 'breakdown-history', icon: 'history' },
        { label: 'Spare Parts Management', route: 'spare-parts', icon: 'settings_input_component' }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Machine Performance', route: 'performance', icon: 'speed' },
        { label: 'Machine Health', route: 'health', icon: 'health_and_safety' },
        { label: 'Downtime Analysis', route: 'downtime-analysis', icon: 'query_stats' },
        { label: 'Production Loss', route: 'production-loss', icon: 'trending_down' },
        { label: 'AI Machine Insights', route: 'ai-insights', icon: 'psychology' },
        { label: 'Machine Reports', route: 'reports', icon: 'description' }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'Machine Settings', route: 'settings', icon: 'settings' }
      ]
    }
  ];

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  getInitials(name: string | null): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
