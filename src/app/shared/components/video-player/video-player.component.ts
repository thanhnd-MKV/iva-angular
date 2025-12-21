import { Component, Input, ViewChild, ElementRef, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSliderModule],
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.css']
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('progressBar') progressBar!: ElementRef<HTMLDivElement>;
  
  @Input() videoUrl: string = '';
  @Input() autoplay: boolean = false;
  @Input() showControls: boolean = true;
  @Input() showTimeline: boolean = true;
  @Output() videoLoaded = new EventEmitter<void>();
  @Output() videoError = new EventEmitter<any>();
  
  // Playback state
  isPlaying: boolean = false;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // Video properties
  currentTime: number = 0;
  duration: number = 0;
  buffered: number = 0;
  volume: number = 1;
  isMuted: boolean = false;
  playbackRate: number = 1;
  
  // UI state
  showVolumeSlider: boolean = false;
  showSpeedMenu: boolean = false;
  isFullscreen: boolean = false;
  isDraggingProgress: boolean = false;
  showControls_: boolean = true; // Always show initially
  controlsTimeout: any;
  
  // Timeline markers (hours)
  timelineMarkers: { time: number; label: string }[] = [];
  
  // Playback speeds
  playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  ngOnInit() {
    this.generateTimelineMarkers();
  }
  
  ngOnDestroy() {
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
  }
  
  // Generate timeline markers for every hour
  generateTimelineMarkers() {
    // Generate markers for 24 hours
    for (let hour = 0; hour <= 23; hour++) {
      this.timelineMarkers.push({
        time: hour * 3600, // Convert to seconds
        label: `${hour.toString().padStart(2, '0')}:00`
      });
    }
  }
  
  // Video loaded metadata
  onLoadedMetadata() {
    if (this.videoElement?.nativeElement) {
      this.duration = this.videoElement.nativeElement.duration;
      this.isLoading = false;
      this.videoLoaded.emit();
      
      if (this.autoplay) {
        this.play();
      }
    }
  }
  
  // Video error handler
  onVideoError(event: any) {
    this.hasError = true;
    this.isLoading = false;
    this.errorMessage = 'Không thể tải video';
    this.videoError.emit(event);
  }
  
  // Time update handler
  onTimeUpdate() {
    if (!this.isDraggingProgress && this.videoElement?.nativeElement) {
      this.currentTime = this.videoElement.nativeElement.currentTime;
      this.updateBuffered();
    }
  }
  
  // Update buffered range
  updateBuffered() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        this.buffered = (bufferedEnd / this.duration) * 100;
      }
    }
  }
  
  // Play video
  play() {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.play();
      this.isPlaying = true;
      // Start auto-hide timer for controls
      this.onMouseMove();
    }
  }
  
  // Pause video
  pause() {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
      this.isPlaying = false;
      // Keep controls visible when paused
      this.showControls_ = true;
      if (this.controlsTimeout) {
        clearTimeout(this.controlsTimeout);
      }
    }
  }
  
  // Toggle play/pause
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  // Skip backward (10 seconds)
  skipBackward() {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.currentTime = Math.max(0, this.currentTime - 10);
    }
  }
  
  // Skip forward (10 seconds)
  skipForward() {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.currentTime = Math.min(this.duration, this.currentTime + 10);
    }
  }
  
  // Seek to specific time
  seekTo(time: number) {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.currentTime = time;
      this.currentTime = time;
    }
  }
  
  // Handle progress bar click
  onProgressBarClick(event: MouseEvent) {
    if (this.progressBar?.nativeElement) {
      const rect = this.progressBar.nativeElement.getBoundingClientRect();
      const pos = (event.clientX - rect.left) / rect.width;
      const time = pos * this.duration;
      this.seekTo(time);
    }
  }
  
  // Handle progress drag start
  onProgressDragStart() {
    this.isDraggingProgress = true;
  }
  
  // Handle progress drag
  onProgressDrag(event: MouseEvent) {
    if (this.isDraggingProgress && this.progressBar?.nativeElement) {
      const rect = this.progressBar.nativeElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const time = pos * this.duration;
      this.currentTime = time;
    }
  }
  
  // Handle progress drag end
  onProgressDragEnd(event: MouseEvent) {
    if (this.isDraggingProgress && this.progressBar?.nativeElement) {
      const rect = this.progressBar.nativeElement.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const time = pos * this.duration;
      this.seekTo(time);
      this.isDraggingProgress = false;
    }
  }
  
  // Toggle mute
  toggleMute() {
    if (this.videoElement?.nativeElement) {
      this.isMuted = !this.isMuted;
      this.videoElement.nativeElement.muted = this.isMuted;
    }
  }
  
  // Change volume
  onVolumeChange(event: any) {
    const value = parseFloat(event.target.value);
    this.volume = value;
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.volume = value;
      this.isMuted = value === 0;
    }
  }
  
  // Change playback speed
  changePlaybackSpeed(speed: number) {
    this.playbackRate = speed;
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.playbackRate = speed;
    }
    this.showSpeedMenu = false;
  }
  
  // Toggle fullscreen
  toggleFullscreen() {
    const container = this.videoElement?.nativeElement.parentElement;
    if (!container) return;
    
    if (!this.isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      this.isFullscreen = false;
    }
  }
  
  // Format time display
  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Get progress percentage
  getProgressPercentage(): number {
    if (!this.duration) return 0;
    return (this.currentTime / this.duration) * 100;
  }
  
  // Get timeline marker position
  getMarkerPosition(markerTime: number): number {
    if (!this.duration) return 0;
    return (markerTime / this.duration) * 100;
  }
  
  // Check if marker should be visible based on video duration
  isMarkerVisible(markerTime: number): boolean {
    return markerTime <= this.duration;
  }
  
  // Mouse move handler - show controls
  onMouseMove() {
    this.showControls_ = true;
    
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    
    // Only hide controls if playing
    if (this.isPlaying) {
      this.controlsTimeout = setTimeout(() => {
        this.showControls_ = false;
      }, 3000);
    }
  }
  
  // Mouse leave handler
  onMouseLeave() {
    // Don't hide controls when paused
    if (this.isPlaying) {
      if (this.controlsTimeout) {
        clearTimeout(this.controlsTimeout);
      }
      this.controlsTimeout = setTimeout(() => {
        this.showControls_ = false;
      }, 1000);
    }
  }
  
  // Download video
  downloadVideo() {
    const link = document.createElement('a');
    link.href = this.videoUrl;
    link.download = `video_${Date.now()}.mp4`;
    link.click();
  }
}
