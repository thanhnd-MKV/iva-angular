import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-thong-ke-su-kien",
  template: `
    <div class="thong-ke-container">
      <button class="mobile-menu-toggle" (click)="toggleMobileMenu()">
        <span class="menu-icon"></span>
      </button>

      <div class="sidebar" [class.active]="mobileMenuOpen">
        <button class="close-menu" (click)="toggleMobileMenu()">��</button>
        <div class="sidebar-content">
          <div class="sidebar-header">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/be67978ed8ec1355328b245601ed6dcbfd1157e8?placeholderIfAbsent=true"
              class="logo-primary"
            />
            <img
              src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/3d054f880797086ac0f705b294bd1e0124b87082?placeholderIfAbsent=true"
              class="logo-secondary"
            />
            <div class="sidebar-nav">
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-map"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-camera"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-location"></div>
                </div>
              </div>
              <div class="nav-item active">
                <div class="nav-icon-wrapper">
                  <div class="icon-edit"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-settings"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-traffic-event"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-calendar"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-report"></div>
                </div>
              </div>
              <div class="nav-item">
                <div class="nav-icon-wrapper">
                  <div class="icon-group-setting"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="sidebar-footer">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/e86bb448ae71ac9c77881494a408164cb1b05ed6?placeholderIfAbsent=true"
              class="divider"
            />
            <div class="user-profile">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/5f720c9f6e2c75c87409cdfbd5574228bc620471?placeholderIfAbsent=true"
                class="avatar"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <div class="header">
          <div class="title-section">
            <div class="page-title">Vi phạm giao thông</div>
            <div class="date-display">
              <div class="time">10:00</div>
              <div class="date-separator"></div>
              <div class="date">15-12-2024</div>
            </div>
          </div>
          <div class="filter-section">
            <div class="filter-button">
              <div class="filter-content">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/fd90cdef2a6fdaa5d4f49af9b80bd9cc051660ff?placeholderIfAbsent=true"
                  class="filter-icon"
                />
                <div class="filter-text">Lọc</div>
                <div class="filter-badge">3</div>
              </div>
              <div class="icon"></div>
            </div>
            <div class="search-input">
              <div class="icon"></div>
              <div class="search-placeholder">Search</div>
            </div>
            <div class="date-range">
              <div class="icon"></div>
              <div class="date-range-text">12/3/2025 - 1/4/2025</div>
            </div>
          </div>
        </div>
        <div class="stats-section" [attr.space]="15">
          <div class="stats-row">
            <div class="stats-column left-column">
              <div class="stats-content">
                <div class="card-row" [attr.space]="24">
                  <div class="card-container">
                    <div class="total-violations-column">
                      <div class="stats-card primary">
                        <div class="card-label">Tổng vi phạm</div>
                        <div class="card-data">
                          <div class="value">0</div>
                          <div class="trend">
                            <div class="trend-value positive">+0%</div>
                            <div class="trend-icon">
                              <img
                                src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/66af1faa03d3fe2b924b25211624a90f9b31c2fa?placeholderIfAbsent=true"
                                class="trend-arrow"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="violations-status-column">
                      <div class="status-cards">
                        <div class="stats-card secondary">
                          <div class="card-label">Đã xl</div>
                          <div class="card-data">
                            <div class="value">0</div>
                            <div class="trend">
                              <div class="trend-value positive">+0%</div>
                              <div class="trend-icon">
                                <img
                                  src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/66af1faa03d3fe2b924b25211624a90f9b31c2fa?placeholderIfAbsent=true"
                                  class="trend-arrow"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="stats-card secondary">
                          <div class="card-label">Chờ xl</div>
                          <div class="card-data">
                            <div class="value">0</div>
                            <div class="trend">
                              <div class="trend-value positive">+0%</div>
                              <div class="trend-icon">
                                <img
                                  src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/66af1faa03d3fe2b924b25211624a90f9b31c2fa?placeholderIfAbsent=true"
                                  class="trend-arrow"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="vehicle-chart-container">
                  <div class="chart-title">
                    vi phạm giao thông theo loại phương tiện
                  </div>
                  <div class="chart-content">
                    <div class="chart-bars">
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                      <div class="bar-container"><div class="bar"></div></div>
                    </div>
                    <div class="chart-labels">
                      <div class="label">ô tô</div>
                      <div class="label">Máy kéo</div>
                      <div class="label">Rơ Moóc</div>
                      <div class="label">Mô tô 2bánh</div>
                      <div class="label">
                        Mô tô
                        <br />
                        3bánh
                      </div>
                      <div class="label">Xe gắn máy</div>
                      <div class="label">Xe đạp</div>
                      <div class="label">Xích lô</div>
                      <div class="label">Xe lăn</div>
                      <div class="label">Xe kéo gia súc</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="stats-column right-column">
              <div class="violation-types-container">
                <div class="chart-title">lượt vi phạm giao thông theo loại</div>
                <div class="violation-chart" [attr.space]="132">
                  <div class="chart-content">
                    <div class="chart-column bars-column">
                      <div class="chart-data">
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="bar-line"></div>
                        <div class="values">
                          <div class="value-label">34</div>
                          <div class="value-label">90</div>
                          <div class="value-label">124</div>
                        </div>
                      </div>
                    </div>
                    <div class="chart-column labels-column">
                      <div class="labels-container">
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Vượt quá tốc độ quy định</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">
                            Vi phạm tín hiệu đèn giao thông
                          </div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">
                            Chạy chậm hơn tốc độ tối thiểu
                          </div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Di chuyển vào đường cấm</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Vượt đèn đỏ</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Di chuyển lấn làn</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">
                            Chở quá số người quy định
                          </div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Đi ngược chiều</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Không đội mũ bảo hiểm</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Đi sai làn đường</div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">
                            Quay đầu xe không đúng nơi
                          </div>
                        </div>
                        <div class="label-item">
                          <div class="color-indicator"></div>
                          <div class="label-text">Dừng đỗ sai quy định</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bottom-section" [attr.space]="17">
          <div class="bottom-row">
            <div class="bottom-column hourly-column">
              <div class="hourly-container">
                <div class="chart-title">
                  lượt vi phạm giao thông theo khung giờ (chọn theo ngày, tuần,
                  tháng)
                </div>
                <div class="hourly-chart">
                  <div class="day-labels">
                    <div class="day-label">Mon</div>
                    <div class="day-label">Tus</div>
                    <div class="day-label">Mon</div>
                    <div class="day-label">Wed</div>
                    <div class="day-label">Thu</div>
                    <div class="day-label">Fri</div>
                    <div class="day-label">Sat</div>
                    <div class="day-label">Sun</div>
                  </div>
                  <div class="hourly-grid">
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell highlight">21</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell highlight-medium">123</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell highlight-high">3213</div>
                    <div class="grid-cell highlight-medium">213</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                    <div class="grid-cell">0</div>
                  </div>
                </div>
                <div class="time-labels">
                  <div class="time-label">0-2</div>
                  <div class="time-label">2-4</div>
                  <div class="time-label">4-6</div>
                  <div class="time-label">6-8</div>
                  <div class="time-label">8-10</div>
                  <div class="time-label">10-12</div>
                  <div class="time-label">12-14</div>
                  <div class="time-label">14-16</div>
                  <div class="time-label">16-18</div>
                  <div class="time-label">18-20</div>
                  <div class="time-label">20-22</div>
                  <div class="time-label">22-24</div>
                </div>
              </div>
            </div>
            <div class="bottom-column camera-column">
              <div class="camera-container">
                <div class="chart-title">vi phạm giao thông theo camera.</div>
                <div class="camera-chart">
                  <div class="camera-bar"><div class="bar"></div></div>
                  <div class="camera-bar"><div class="bar"></div></div>
                  <div class="camera-bar"><div class="bar"></div></div>
                  <div class="camera-bar"><div class="bar"></div></div>
                  <div class="camera-bar"><div class="bar"></div></div>
                  <div class="camera-bar"><div class="bar"></div></div>
                  <div class="camera-bar"><div class="bar"></div></div>
                </div>
                <div class="camera-labels">
                  <div class="camera-label">Cam 1</div>
                  <div class="camera-label">Cam 1</div>
                  <div class="camera-label">Cam 1</div>
                  <div class="camera-label">Cam 1</div>
                  <div class="camera-label">Cam 1</div>
                  <div class="camera-label">Cam 1</div>
                  <div class="camera-label">Cam 1</div>
                </div>
              </div>
            </div>
            <div class="bottom-column monthly-column">
              <div class="monthly-container">
                <div class="chart-title">
                  vi phạm giao thông trong 12 tháng gần nhất
                </div>
                <div class="monthly-chart">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/41652414f93940e2931e10035fe3b479/41fec3a61584e4d322894fc5c2b1a35a1c917fd4?placeholderIfAbsent=true"
                    class="chart-image"
                  />
                </div>
                <div class="month-labels">
                  <div class="month-label">11/23</div>
                  <div class="month-label">12</div>
                  <div class="month-label">1/24</div>
                  <div class="month-label">2</div>
                  <div class="month-label">3</div>
                  <div class="month-label">4</div>
                  <div class="month-label">5</div>
                  <div class="month-label">6</div>
                  <div class="month-label">7</div>
                  <div class="month-label">8</div>
                  <div class="month-label">9</div>
                  <div class="month-label">10</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .thong-ke-container {
        display: flex;
        padding-right: 28px;
        align-items: stretch;
        gap: 29px;
        overflow: hidden;
        flex-wrap: wrap;
        background-color: #f4f4f4;
        position: relative;
      }
      @media (max-width: 991px) {
        .thong-ke-container {
          padding-right: 20px;
          flex-direction: column;
        }
      }
      .mobile-menu-toggle {
        display: none;
        position: fixed;
        top: 15px;
        left: 15px;
        z-index: 1000;
        background-color: #194185;
        border: none;
        border-radius: 4px;
        width: 40px;
        height: 40px;
        cursor: pointer;
        align-items: center;
        justify-content: center;
      }
      .menu-icon {
        display: block;
        width: 24px;
        height: 2px;
        background-color: white;
        position: relative;
      }
      .menu-icon:before,
      .menu-icon:after {
        content: "";
        display: block;
        width: 24px;
        height: 2px;
        background-color: white;
        position: absolute;
      }
      .menu-icon:before {
        top: -6px;
      }
      .menu-icon:after {
        bottom: -6px;
      }
      .close-menu {
        display: none;
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 24px;
        color: white;
        cursor: pointer;
      }
      @media (max-width: 991px) {
        .mobile-menu-toggle {
          display: flex;
        }
        .close-menu {
          display: block;
        }
      }
      .sidebar {
        justify-content: center;
        align-items: stretch;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        background-color: #194185;
        z-index: 100;
      }
      @media (max-width: 991px) {
        .sidebar {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 250px;
          border-radius: 0;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
          overflow-y: auto;
        }
        .sidebar.active {
          display: flex;
        }
      }
      .sidebar-content {
        padding: 36px 0;
      }
      @media (max-width: 991px) {
        .sidebar-content {
          display: none;
        }
      }
      .sidebar-header {
        display: flex;
        width: 100%;
        padding: 0 12px;
        flex-direction: column;
        align-items: stretch;
        justify-content: start;
      }
      .logo-primary {
        aspect-ratio: 1.62;
        object-fit: contain;
        object-position: center;
        width: 76px;
      }
      .logo-secondary {
        object-fit: contain;
        object-position: center;
        width: 76px;
        margin-top: 29px;
      }
      .sidebar-nav {
        align-self: center;
        margin-top: 29px;
        width: 100%;
        max-width: 56px;
      }
      .nav-item {
        border-radius: 8px;
        display: flex;
        min-height: 48px;
        width: 100%;
        padding: 12px 16px;
        align-items: center;
        justify-content: space-between;
      }
      .nav-item.active {
        justify-content: space-between;
        align-items: center;
        border-radius: 8px;
        box-shadow: 0px 4px 5px 0px rgba(0, 0, 0, 0.1);
        display: flex;
        min-height: 48px;
        width: 100%;
        padding: 12px 16px;
        background-color: #fff;
      }
      .nav-icon-wrapper {
        align-self: stretch;
        display: flex;
        margin: auto 0;
        width: 100%;
        align-items: center;
        gap: 10px;
        justify-content: start;
        flex: 1;
        flex-shrink: 1;
        flex-basis: 0%;
      }
      .icon-map,
      .icon-camera,
      .icon-location,
      .icon-edit,
      .icon-settings,
      .icon-traffic-event,
      .icon-calendar,
      .icon-report,
      .icon-group-setting {
        align-self: stretch;
        display: flex;
        min-height: 24px;
        margin: auto 0;
        width: 24px;
      }
      .sidebar-footer {
        margin-top: 407px;
        width: 100%;
        padding: 0 11px;
      }
      @media (max-width: 991px) {
        .sidebar-footer {
          margin-top: 40px;
        }
      }
      .divider {
        aspect-ratio: 38.46;
        object-fit: contain;
        object-position: center;
        width: 78px;
      }
      .user-profile {
        display: flex;
        margin-top: 20px;
        width: 100%;
        padding: 0 16px;
        align-items: center;
        gap: 12px;
        justify-content: center;
      }
      .avatar {
        aspect-ratio: 1;
        object-fit: contain;
        object-position: center;
        width: 44px;
        fill: #fff;
        align-self: stretch;
        margin: auto 0;
      }
      .main-content {
        display: flex;
        margin: auto 0;
        flex-direction: column;
        align-items: stretch;
        flex-grow: 1;
        flex-shrink: 0;
        flex-basis: 0;
        width: fit-content;
      }
      @media (max-width: 991px) {
        .main-content {
          max-width: 100%;
          width: 100%;
          margin-top: 20px;
          padding-left: 10px;
        }
      }
      .header {
        display: flex;
        margin-right: 29px;
        width: 100%;
        max-width: 1726px;
        align-items: stretch;
        gap: 20px;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        flex-wrap: wrap;
        justify-content: space-between;
      }
      @media (max-width: 991px) {
        .header {
          max-width: 100%;
          margin-right: 10px;
          flex-direction: column;
          gap: 15px;
        }
      }
      @media (max-width: 576px) {
        .header {
          padding-top: 50px; /* Space for the mobile menu button */
        }
      }
      .page-title {
        color: #1a1a1a;
        font-size: 32px;
        font-weight: 600;
        line-height: 1.3;
        margin: auto 0;
      }
      .date-display {
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        display: flex;
        min-height: 60px;
        padding: 15px 21px;
        gap: 9px;
        white-space: nowrap;
        line-height: 1.1;
        background-color: #eaeaea;
      }
      @media (max-width: 991px) {
        .date-display {
          padding: 15px 20px;
          white-space: initial;
        }
      }
      .time {
        color: #585f67;
        text-align: center;
        font-size: 24px;
        font-weight: 600;
        align-self: stretch;
        margin: auto 0;
      }
      .date-separator {
        border-color: rgba(137, 143, 150, 1);
        border-style: solid;
        border-width: 1px;
        background-color: #898f96;
        align-self: stretch;
        margin: auto 0;
        width: 0px;
        flex-shrink: 0;
        height: 30px;
      }
      .date {
        color: #898f96;
        font-size: 20px;
        font-weight: 400;
        align-self: stretch;
        margin: auto 0;
      }
      .filter-section {
        align-self: start;
        display: flex;
        margin-top: 62px;
        align-items: center;
        gap: 8px;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-weight: 400;
        line-height: 1.3;
        justify-content: start;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .filter-section {
          max-width: 100%;
          margin-top: 20px;
          justify-content: center;
          gap: 10px;
        }
      }
      @media (max-width: 576px) {
        .filter-section {
          flex-direction: column;
          align-items: stretch;
        }
      }
      .filter-button {
        justify-content: space-between;
        align-items: center;
        border-radius: 6px;
        border: 1px solid var(--Tertiary-03, #8f9095);
        align-self: stretch;
        display: flex;
        margin: auto 0;
        padding: 8px;
        gap: 40px 44px;
        white-space: nowrap;
        width: 154px;
        background-color: #eaeaea;
      }
      @media (max-width: 991px) {
        .filter-button {
          white-space: initial;
        }
      }
      .filter-content {
        align-self: stretch;
        display: flex;
        margin: auto 0;
        align-items: center;
        gap: 4px;
        justify-content: start;
      }
      @media (max-width: 991px) {
        .filter-content {
          white-space: initial;
        }
      }
      .filter-icon {
        aspect-ratio: 1;
        object-fit: contain;
        object-position: center;
        width: 20px;
        align-self: stretch;
        margin: auto 0;
        flex-shrink: 0;
      }
      .filter-text {
        color: #000;
        font-size: 16px;
        align-self: stretch;
        margin: auto 0;
      }
      .filter-badge {
        color: #fff;
        border-radius: 13px;
        background-color: rgba(212, 3, 6, 1);
        align-self: stretch;
        margin: auto 0;
        min-height: 16px;
        overflow: hidden;
        font-size: 11px;
        text-align: center;
        width: 16px;
        height: 16px;
      }
      @media (max-width: 991px) {
        .filter-badge {
          white-space: initial;
        }
      }
      .icon {
        align-self: stretch;
        display: flex;
        margin: auto 0;
        width: 20px;
        flex-shrink: 0;
        height: 20px;
      }
      .search-input {
        align-items: center;
        border-radius: 6px;
        border: 1px solid var(--Tertiary-03, #8f9095);
        align-self: stretch;
        display: flex;
        margin: auto 0;
        padding: 8px;
        gap: 4px;
        font-size: 16px;
        color: #000;
        white-space: nowrap;
        justify-content: start;
        width: 192px;
        background-color: #eaeaea;
      }
      @media (max-width: 991px) {
        .search-input {
          white-space: initial;
        }
      }
      .search-placeholder {
        align-self: stretch;
        margin: auto 0;
      }
      .date-range {
        align-items: center;
        border-radius: 6px;
        border: 1px solid var(--Tertiary-03, #8f9095);
        align-self: stretch;
        display: flex;
        margin: auto 0;
        padding: 8px;
        gap: 4px;
        font-size: 16px;
        color: #000;
        justify-content: start;
        background-color: #eaeaea;
      }
      .date-range-text {
        align-self: stretch;
        margin: auto 0;
      }
      .stats-section {
        margin-top: 21px;
      }
      @media (max-width: 991px) {
        .stats-section {
          max-width: 100%;
        }
      }
      .stats-row {
        gap: 20px;
        display: flex;
      }
      @media (max-width: 991px) {
        .stats-row {
          flex-direction: column;
          align-items: stretch;
          gap: 20px;
        }
      }
      .stats-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 50%;
        margin-left: 0px;
      }
      @media (max-width: 991px) {
        .stats-column {
          width: 100%;
        }
      }
      .stats-content {
        width: 100%;
      }
      @media (max-width: 991px) {
        .stats-content {
          max-width: 100%;
          margin-top: 15px;
        }
      }
      .card-row {
        width: 100%;
      }
      @media (max-width: 991px) {
        .card-row {
          max-width: 100%;
        }
      }
      .card-container {
        gap: 20px;
        display: flex;
      }
      @media (max-width: 991px) {
        .card-container {
          flex-direction: column;
          align-items: stretch;
          gap: 20px;
        }
      }
      .total-violations-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 31%;
        margin-left: 0px;
      }
      @media (max-width: 991px) {
        .total-violations-column {
          width: 100%;
        }
      }
      .stats-card {
        min-width: 200px;
        border-radius: 16px;
        margin-left: auto;
        margin-right: auto;
        min-height: 126px;
        width: 100%;
        padding: 24px;
      }
      .stats-card.primary {
        background-color: #c9cacb;
      }
      .stats-card.secondary {
        background-color: #eaeaea;
      }
      @media (max-width: 991px) {
        .stats-card {
          margin-top: 0;
          padding: 20px;
        }
      }
      @media (max-width: 576px) {
        .stats-card {
          min-height: auto;
          padding: 15px;
        }
      }
      .card-label {
        color: #000;
        border-radius: 8px;
        width: 100%;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
      }
      .card-data {
        display: flex;
        margin-top: 16px;
        width: 100%;
        align-items: center;
        gap: 40px 88px;
        justify-content: space-between;
      }
      .value {
        color: #000;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 32px;
        font-weight: 600;
        line-height: 1.3;
        align-self: stretch;
        margin: auto 0;
      }
      .trend {
        align-self: stretch;
        display: flex;
        margin: auto 0;
        align-items: start;
        gap: 8px;
        justify-content: start;
      }
      .trend-value {
        color: #000;
        font-feature-settings:
          "ss01" on,
          "cv01" on;
        font-family: Inter;
        font-size: 12px;
        font-weight: 400;
        line-height: 1;
        letter-spacing: 0px;
        width: 44px;
      }
      .trend-icon {
        justify-content: center;
        align-items: center;
        border-radius: 8px;
        display: flex;
        width: 16px;
      }
      .trend-arrow {
        aspect-ratio: 1;
        object-fit: contain;
        object-position: center;
        width: 16px;
        align-self: stretch;
        margin: auto 0;
        height: 16px;
      }
      .violations-status-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 69%;
        margin-left: 20px;
      }
      @media (max-width: 991px) {
        .violations-status-column {
          width: 100%;
        }
      }
      .status-cards {
        display: flex;
        flex-grow: 1;
        align-items: center;
        gap: 14px;
        justify-content: start;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .status-cards {
          margin-top: 24px;
        }
      }
      .vehicle-chart-container {
        background-color: rgba(217, 217, 217, 1);
        display: flex;
        margin-top: 15px;
        padding: 16px 21px;
        flex-direction: column;
        align-items: stretch;
      }
      @media (max-width: 991px) {
        .vehicle-chart-container {
          max-width: 100%;
          padding: 16px 20px;
        }
      }
      .chart-title {
        color: #000;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 18px;
        font-weight: 500;
        line-height: 1.3;
        align-self: start;
      }
      .chart-content {
        margin-top: 59px;
        width: 100%;
      }
      @media (max-width: 991px) {
        .chart-content {
          max-width: 100%;
          margin-top: 40px;
        }
      }
      .chart-bars {
        justify-content: center;
        align-items: end;
        border-bottom: 2px solid var(--Cerulean-Blue-700, #036bf4);
        border-left: 2px solid var(--Cerulean-Blue-700, #036bf4);
        display: flex;
        width: 100%;
        gap: 26px;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .chart-bars {
          max-width: 100%;
          gap: 10px;
        }
      }
      @media (max-width: 576px) {
        .chart-bars {
          gap: 5px;
        }
        .bar-container .bar {
          width: 20px;
        }
      }
      .bar-container {
        display: flex;
        padding: 0 10px;
        align-items: end;
        gap: 10px;
        justify-content: center;
        flex: 1;
        flex-shrink: 1;
        flex-basis: 0%;
      }
      .bar {
        border-radius: 2px;
        background-color: rgba(156, 160, 162, 1);
        display: flex;
        min-height: 103px;
        width: 40px;
      }
      .bar-container:nth-child(1) .bar {
        min-height: 103px;
      }
      .bar-container:nth-child(2) .bar {
        min-height: 94px;
      }
      .bar-container:nth-child(3) .bar {
        min-height: 55px;
      }
      .bar-container:nth-child(4) .bar {
        min-height: 181px;
      }
      .bar-container:nth-child(5) .bar {
        min-height: 66px;
      }
      .bar-container:nth-child(6) .bar {
        min-height: 91px;
      }
      .bar-container:nth-child(7) .bar {
        min-height: 144px;
      }
      .bar-container:nth-child(8) .bar {
        min-height: 96px;
      }
      .bar-container:nth-child(9) .bar {
        min-height: 25px;
      }
      .bar-container:nth-child(10) .bar {
        min-height: 8px;
      }
      .chart-labels {
        display: flex;
        margin-top: 12px;
        width: 100%;
        align-items: start;
        gap: 9px;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 14px;
        color: #000;
        font-weight: 400;
        text-align: center;
        line-height: 1.3;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .chart-labels {
          max-width: 100%;
        }
      }
      @media (max-width: 576px) {
        .chart-labels {
          font-size: 12px;
        }
        .label {
          width: 60px;
        }
      }
      .label {
        width: 80px;
      }
      .label:nth-child(4),
      .label:nth-child(5),
      .label:nth-child(10) {
        line-height: 18px;
      }
      .right-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 50%;
        margin-left: 20px;
      }
      @media (max-width: 991px) {
        .right-column {
          width: 100%;
        }
      }
      .violation-types-container {
        background-color: rgba(217, 217, 217, 1);
        display: flex;
        margin-top: 4px;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
        padding: 12px 16px 46px 16px;
        flex-direction: column;
      }
      @media (max-width: 991px) {
        .violation-types-container {
          max-width: 100%;
          margin-top: 19px;
          padding-right: 20px;
        }
      }
      .violation-chart {
        align-self: end;
        margin-top: 59px;
        width: 654px;
        max-width: 100%;
      }
      @media (max-width: 991px) {
        .violation-chart {
          margin-top: 40px;
        }
      }
      .chart-content {
        gap: 20px;
        display: flex;
      }
      @media (max-width: 991px) {
        .chart-content {
          flex-direction: column;
          align-items: stretch;
          gap: 0px;
        }
      }
      .chart-column.bars-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 55%;
        margin-left: 0px;
      }
      @media (max-width: 991px) {
        .chart-column.bars-column {
          width: 100%;
        }
      }
      .chart-data {
        position: relative;
        min-height: 340px;
        flex-grow: 1;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 18px;
        color: #fff;
        font-weight: 500;
        white-space: nowrap;
        line-height: 1.3;
      }
      @media (max-width: 991px) {
        .chart-data {
          margin-top: 40px;
          white-space: initial;
        }
      }
      .bar-line {
        border-radius: 6px;
        z-index: 0;
        display: flex;
        min-height: 6px;
        width: 100%;
      }
      .bar-line:nth-child(1) {
        background-color: rgba(143, 144, 149, 1);
      }
      .bar-line:nth-child(2) {
        background-color: rgba(201, 202, 203, 1);
      }
      .bar-line:nth-child(3) {
        background-color: rgba(87, 137, 189, 1);
      }
      .bar-line:nth-child(4) {
        background-color: rgba(156, 210, 110, 1);
        min-height: 5px;
      }
      .bar-line:nth-child(5) {
        background-color: rgba(73, 73, 73, 1);
        min-height: 8px;
      }
      .bar-line:nth-child(6) {
        background-color: rgba(158, 177, 196, 1);
        min-height: 12px;
      }
      .bar-line:nth-child(7) {
        background-color: rgba(244, 137, 43, 1);
        min-height: 36px;
        flex: 1;
      }
      .bar-line:nth-child(8) {
        background-color: rgba(255, 181, 97, 1);
        min-height: 92px;
      }
      .bar-line:nth-child(9) {
        background-color: rgba(39, 163, 28, 1);
        min-height: 153px;
      }
      .values {
        border-radius: 0px 0px 0px 0px;
        position: absolute;
        z-index: 0;
        display: flex;
        width: 32px;
        flex-direction: column;
        left: 126px;
        bottom: 15px;
        height: 258px;
      }
      @media (max-width: 991px) {
        .values {
          white-space: initial;
        }
      }
      .value-label {
        color: #fff;
      }
      @media (max-width: 991px) {
        .value-label:nth-child(1) {
          margin-right: 3px;
        }
      }
      .value-label:nth-child(2) {
        margin-top: 62px;
      }
      @media (max-width: 991px) {
        .value-label:nth-child(2) {
          margin-right: 3px;
          margin-top: 40px;
        }
      }
      .value-label:nth-child(3) {
        margin-top: 127px;
      }
      @media (max-width: 991px) {
        .value-label:nth-child(3) {
          margin-top: 40px;
        }
      }
      .chart-column.labels-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 45%;
        margin-left: 20px;
      }
      @media (max-width: 991px) {
        .chart-column.labels-column {
          width: 100%;
        }
      }
      .labels-container {
        display: flex;
        margin-top: 29px;
        width: 100%;
        flex-direction: column;
        align-items: start;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 14px;
        color: #8f9095;
        font-weight: 400;
        line-height: 1.3;
        justify-content: start;
      }
      @media (max-width: 991px) {
        .labels-container {
          margin-top: 40px;
        }
      }
      .label-item {
        align-self: stretch;
        display: flex;
        width: 100%;
        align-items: center;
        gap: 4px;
        justify-content: start;
        margin-top: 8px;
      }
      .label-item:first-child {
        margin-top: 0;
      }
      .color-indicator {
        align-self: stretch;
        display: flex;
        margin: auto 0;
        width: 16px;
        flex-shrink: 0;
        height: 16px;
      }
      .label-item:nth-child(1) .color-indicator {
        background-color: rgba(255, 181, 97, 1);
      }
      .label-item:nth-child(2) .color-indicator {
        background-color: rgba(158, 177, 196, 1);
      }
      .label-item:nth-child(3) .color-indicator {
        background-color: rgba(244, 137, 43, 1);
      }
      .label-item:nth-child(4) .color-indicator {
        background-color: rgba(239, 90, 26, 1);
      }
      .label-item:nth-child(5) .color-indicator {
        background-color: rgba(87, 137, 189, 1);
      }
      .label-item:nth-child(6) .color-indicator {
        background-color: rgba(39, 163, 28, 1);
      }
      .label-item:nth-child(7) .color-indicator {
        background-color: #f4f4f4;
      }
      .label-item:nth-child(8) .color-indicator {
        background-color: rgba(84, 195, 69, 1);
      }
      .label-item:nth-child(9) .color-indicator {
        background-color: #c9cacb;
      }
      .label-item:nth-child(10) .color-indicator {
        background-color: rgba(156, 210, 110, 1);
      }
      .label-item:nth-child(11) .color-indicator {
        background-color: #8f9095;
      }
      .label-item:nth-child(12) .color-indicator {
        background-color: #494949;
      }
      .label-text {
        color: #8f9095;
        align-self: stretch;
        margin: auto 0;
        flex: 1;
        flex-shrink: 1;
        flex-basis: 0%;
      }
      .bottom-section {
        margin-top: 12px;
      }
      @media (max-width: 991px) {
        .bottom-section {
          max-width: 100%;
        }
      }
      .bottom-row {
        gap: 20px;
        display: flex;
      }
      @media (max-width: 991px) {
        .bottom-row {
          flex-direction: column;
          align-items: stretch;
          gap: 20px;
        }
      }
      .bottom-column.hourly-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 41%;
        margin-left: 0px;
      }
      @media (max-width: 991px) {
        .bottom-column.hourly-column {
          width: 100%;
        }
      }
      .hourly-container {
        background-color: rgba(217, 217, 217, 1);
        display: flex;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
        padding: 12px 9px;
        flex-direction: column;
        align-items: stretch;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 14px;
        font-weight: 400;
      }
      @media (max-width: 991px) {
        .hourly-container {
          max-width: 100%;
          margin-top: 17px;
        }
      }
      .hourly-chart {
        display: flex;
        margin-top: 22px;
        width: 100%;
        align-items: stretch;
        gap: 3px;
        white-space: nowrap;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .hourly-chart {
          max-width: 100%;
          white-space: initial;
        }
      }
      .day-labels {
        color: #494949;
        line-height: 18px;
      }
      @media (max-width: 991px) {
        .day-labels {
          white-space: initial;
        }
      }
      .day-label {
        color: #494949;
      }
      .hourly-grid {
        display: flex;
        align-items: center;
        gap: 2px;
        color: #8f9095;
        text-align: center;
        line-height: 1.3;
        justify-content: start;
        flex-wrap: wrap;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: auto;
      }
      @media (max-width: 991px) {
        .hourly-grid {
          max-width: 100%;
          white-space: initial;
        }
      }
      @media (max-width: 576px) {
        .hourly-grid {
          gap: 1px;
        }
        .grid-cell {
          padding: 3px 5px;
          font-size: 12px;
          min-height: 22px;
          width: 30px;
        }
      }
      .grid-cell {
        color: #8f9095;
        align-self: stretch;
        margin: auto 0;
        min-height: 28px;
        padding: 5px 10px;
        gap: 10px;
        flex-grow: 1;
        flex-shrink: 1;
        width: 42px;
        background-color: #eaeaea;
      }
      @media (max-width: 991px) {
        .grid-cell {
          white-space: initial;
        }
      }
      .grid-cell.highlight {
        color: #1a1a1a;
        background-color: #fff;
      }
      .grid-cell.highlight-medium {
        color: #1a1a1a;
        background-color: #fff;
      }
      .grid-cell.highlight-high {
        color: #1a1a1a;
        background-color: #fff;
      }
      @media (max-width: 991px) {
        .grid-cell.highlight,
        .grid-cell.highlight-medium,
        .grid-cell.highlight-high {
          white-space: initial;
        }
      }
      .time-labels {
        align-self: end;
        display: flex;
        margin-top: 7px;
        align-items: start;
        gap: 2px;
        color: #494949;
        white-space: nowrap;
        text-align: center;
        line-height: 1.3;
        justify-content: start;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .time-labels {
          white-space: initial;
        }
      }
      .time-label {
        color: #494949;
        width: 52px;
      }
      .bottom-column.camera-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 27%;
        margin-left: 20px;
      }
      @media (max-width: 991px) {
        .bottom-column.camera-column {
          width: 100%;
        }
      }
      .camera-container {
        background-color: rgba(217, 217, 217, 1);
        display: flex;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
        padding: 11px 13px 29px;
        flex-direction: column;
        align-items: stretch;
      }
      @media (max-width: 991px) {
        .camera-container {
          max-width: 100%;
          margin-top: 17px;
        }
      }
      .camera-chart {
        justify-content: center;
        align-items: end;
        border-bottom: 2px solid var(--Cerulean-Blue-700, #036bf4);
        border-left: 2px solid var(--Cerulean-Blue-700, #036bf4);
        display: flex;
        margin-top: 42px;
        width: 100%;
        gap: 12px;
      }
      @media (max-width: 991px) {
        .camera-chart {
          max-width: 100%;
          margin-top: 40px;
        }
      }
      @media (max-width: 576px) {
        .camera-chart {
          gap: 5px;
        }
      }
      .camera-bar {
        display: flex;
        padding: 0 8px;
        align-items: end;
        gap: 12px;
        justify-content: center;
        flex: 1;
        flex-shrink: 1;
        flex-basis: 0%;
      }
      .camera-bar .bar {
        border-radius: 4px;
        background-color: rgba(156, 160, 162, 1);
        display: flex;
        width: 100%;
        flex: 1;
        flex-shrink: 1;
        flex-basis: 0%;
      }
      .camera-bar:nth-child(1) .bar {
        min-height: 103px;
      }
      .camera-bar:nth-child(2) .bar {
        min-height: 181px;
      }
      .camera-bar:nth-child(3) .bar {
        min-height: 91px;
      }
      .camera-bar:nth-child(4) .bar {
        min-height: 91px;
      }
      .camera-bar:nth-child(5) .bar {
        min-height: 182px;
      }
      .camera-bar:nth-child(6) .bar {
        min-height: 35px;
        width: 35px;
        height: 35px;
      }
      .camera-bar:nth-child(7) .bar {
        min-height: 96px;
      }
      .camera-labels {
        display: flex;
        margin-top: 27px;
        align-items: stretch;
        gap: 12px;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 14px;
        color: #000;
        font-weight: 400;
        white-space: nowrap;
        text-align: center;
        line-height: 1.3;
        justify-content: start;
      }
      @media (max-width: 991px) {
        .camera-labels {
          white-space: initial;
        }
      }
      .camera-label {
        text-overflow: ellipsis;
        flex: 1;
        flex-shrink: 1;
        flex-basis: 0%;
      }
      @media (max-width: 991px) {
        .camera-label {
          white-space: initial;
        }
      }
      .bottom-column.monthly-column {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        line-height: normal;
        width: 33%;
        margin-left: 20px;
      }
      @media (max-width: 991px) {
        .bottom-column.monthly-column {
          width: 100%;
        }
      }
      .monthly-container {
        background-color: rgba(217, 217, 217, 1);
        display: flex;
        margin-left: auto;
        margin-right: auto;
        width: 100%;
        padding: 11px 14px 33px;
        flex-direction: column;
        align-items: stretch;
      }
      @media (max-width: 991px) {
        .monthly-container {
          max-width: 100%;
          margin-top: 17px;
        }
      }
      .monthly-chart {
        justify-content: center;
        align-items: end;
        border-bottom: 2px solid var(--Cerulean-Blue-950, #0f2d5c);
        border-left: 2px solid var(--Cerulean-Blue-950, #0f2d5c);
        display: flex;
        margin-top: 48px;
        margin-left: 14px;
        gap: 8px;
      }
      @media (max-width: 991px) {
        .monthly-chart {
          margin-right: 4px;
          margin-top: 40px;
        }
      }
      .chart-image {
        aspect-ratio: 2.73;
        object-fit: contain;
        object-position: center;
        width: 484px;
        fill: #e7f1f7;
        stroke-width: 2px;
        stroke: #0357d4;
        min-width: 240px;
      }
      @media (max-width: 576px) {
        .chart-image {
          min-width: 100%;
          width: 100%;
        }
      }
      .month-labels {
        display: flex;
        margin-top: 11px;
        margin-left: 18px;
        align-items: start;
        gap: 8px;
        font-family:
          Be Vietnam Pro,
          -apple-system,
          Roboto,
          Helvetica,
          sans-serif;
        font-size: 14px;
        color: #494949;
        font-weight: 400;
        white-space: nowrap;
        text-align: center;
        line-height: 1.3;
        justify-content: start;
        flex-wrap: wrap;
      }
      @media (max-width: 991px) {
        .month-labels {
          white-space: initial;
        }
      }
      .month-label {
        color: #494949;
        width: 36px;
      }
    `,
  ],
  standalone: true,
  imports: [CommonModule],
})
export class ThongKeSuKienComponent {
  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
