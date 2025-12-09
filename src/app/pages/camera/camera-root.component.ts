import { Component, OnInit } from '@angular/core';
import { BaseTableComponent } from '../../shared/components/table/base-table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-camera-root',
  standalone: true,
  imports: [CommonModule, BaseTableComponent],
  templateUrl: './camera-root.component.html',
  styleUrls: ['./camera-root.component.css']
})
export class CameraRootComponent implements OnInit {

  tableData = [
    {
      name: 'Camera 1',
      sn: 'SN123456',
      installationDate: '2024-01-01',
      location: 'Warehouse A',
      email: 'fgdfgmkv@gmail.com',
      status: 'Active',
      signalStrength: 80,
      battery: 95,
      filePath: 'https://www.w3schools.com/html/mov_bbb.mp4'
    },
    {
      name: 'Camera 2',
      sn: 'SN654321',
      date: '2023-11-15',
      location: 'Gate B',
      email: 'fgdfgmkv@gmail.com',
      status: 'Inactive',
      signalStrength: 45,
      battery: 40,
      filePathImage: 'https://i.ytimg.com/vi/zasZKgIN1cU/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCoVcJK1KqzImvEoVp2Z7smZpX2DA'
    },
    {
      name: 'Camera 3',
      sn: 'SN987654',
      date: '2023-12-01',
      location: 'Warehouse C',
      email: 'fgdfgmkv@gmail.com',
      status: 'Active',
      signalStrength: 70,
      battery: 75,
      filePathImage: null
    },
    {
      name: 'Camera 4',
      sn: 'SN111222',
      date: '2024-02-01',
      location: 'Warehouse D',
      email: 'fgdfgmkv@gmail.com',
      status: 'Inactive',
      signalStrength: null,
      battery: null,
      testCol: null
    }
  ];

  columnsToDisplay: string[] = [
    'name',
    'sn',
    'date',
    'email',
    'location',
    'status',
    'signalStrength',
    'battery',
    'filePath',
    'filePathImage',
  ];

  columnDefs: {
    [key: string]: {
      label?: string;
      type?: 'text' | 'image' | 'video' | 'date';
      fontSize?: string;
      bgColor?: string;
      textColor?: string;
      headerFontSize?: string;
      headerBgColor?: string;
      fontWeight?: string;
    }
  } = {
      name: {
        label: 'Name',
        type: 'text',
        fontSize: '18px',
        bgColor: '#f2f2f2',
        fontWeight: '600',
      },
      sn: { label: 'Serial Number', type: 'text' },
      date: { label: 'Installed On', type: 'date' },
      email: {
        label: 'Email',
        type: 'text',
      },
      location: { label: 'Location', type: 'text' },
      status: { label: 'Status', type: 'text' },
      signalStrength: { label: 'Signal (%)', type: 'text' },
      battery: { label: 'Battery (%)', type: 'text' },
      filePath: {
        label: 'Video',
        type: 'video',
        fontSize: '18px',
        bgColor: '#f2f2f2',
        headerFontSize: '16px',
        headerBgColor: '#222222'
      },
      filePathImage: {
        label: 'Thumbnail',
        type: 'image',
        fontSize: '18px',
        bgColor: '#f2f2f2',
        headerFontSize: '16px',
        headerBgColor: '#222222'
      },
    };

  ngOnInit(): void { }


  handleCreateClick(row: any) {
    alert('Create clicked:' + row);
  }

  handleChangeClick(row: any): void {
    alert('Click clicked:' + row);
  }

  handleDeleteClick(row: any): void {
    alert('Delete clicked:' + row);
  }
  
  handleViewClick(row: any): void {
    alert('View clicked:' + row);
  }

  // Handle refresh from base-table
  onRefreshData() {
    console.log('🔄 Refreshing camera root data');
    // Reload hoặc refresh data logic ở đây
    // Có thể gọi API hoặc reset data
  }

}
