<template>
  <div class="dashboard-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="navbar-brand">
        <h1 class="logo">InQueue</h1>
      </div>
      <div class="branch-info">
        <span class="bank-name">{{ bankName }}</span>
        <span class="branch-name">{{ branchName }}</span>
      </div>
      <div class="nav-actions">
        <button class="logout-btn" @click="logout">
          <span class="logout-icon"></span>
          Logout
        </button>
      </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="dashboard-content">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="branch-details">
          <img :src="getBankLogo(bankName)" alt="Bank Logo" class="bank-logo">
          <div class="branch-text">
            <h3>{{ branchName }}</h3>
            <p>Branch ID: {{ branchId }}</p>
          </div>
        </div>

        <ul class="sidebar-menu">
          <li @click="navigateToDashboard">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </li>
          <li class="active">
            <span class="icon">🗓️</span>
            <span>Appointments</span>
          </li>
          <li @click="navigateToReports">
            <span class="icon">📈</span>
            <span>Reports</span>
          </li>
          <li @click="navigateToSettings">
            <span class="icon">⚙️</span>
            <span>Settings</span>
          </li>
        </ul>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header Section -->
        <div class="content-header">
          <div class="header-content">
            <h2 class="section-title">Appointments Management</h2>
            <p class="section-subtitle">{{ formatDateDisplay(selectedDate) }}</p>
          </div>
          <div class="header-actions">
            <div class="search-box">
              <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search by name, phone or email..."
                  @input="handleSearch"
              >
              <button class="clear-search" v-if="searchQuery" @click="clearSearch">×</button>
              <button class="search-btn" @click="handleSearch">
                <span class="search-icon"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Date Navigation and Filters Section -->
        <div class="controls-container">
          <div class="date-navigation">
            <button class="nav-btn" @click="changeDate(-7)">
              <span class="chevron-left-icon"></span>
              &lt;  Week
            </button>
            <button class="nav-btn" @click="changeDate(-1)">
              <span class="arrow-left-icon"></span>
              &lt;  Day
            </button>
            <div class="date-display">
              {{ formatDateDisplay(selectedDate) }}
            </div>
            <button class="nav-btn" @click="changeDate(1)">
              Day  &gt;
              <span class="arrow-right-icon"></span>
            </button>
            <button class="nav-btn" @click="changeDate(7)">
              Week  &gt;
              <span class="chevron-right-icon"></span>
            </button>
            <button class="today-btn" @click="goToToday">
              Today
            </button>
          </div>

          <div class="filters-section">
            <h3 class="filters-title">Filters</h3>
            <div class="filters-group">
              <div class="filter-item">
                <label>Status:</label>
                <select v-model="statusFilter" @change="applyFilters" class="custom-select">
                  <option value="all">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="waiting">Waiting</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="no-show">No Show</option>
                </select>
              </div>

              <div class="filter-item">
                <label>Service Type:</label>
                <select v-model="serviceTypeFilter" @change="applyFilters" class="custom-select">
                  <option value="all">All Services</option>
                  <option v-for="type in serviceTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </div>

              <div class="filter-item">
                <label>Entity Type:</label>
                <select v-model="entityTypeFilter" @change="applyFilters" class="custom-select">
                  <option value="all">All Types</option>
                  <option v-for="type in entityTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </div>

              <div class="filter-item">
                <label>Window:</label>
                <select v-model="windowFilter" @change="applyFilters" class="custom-select">
                  <option value="all">All Windows</option>
                  <option v-for="window in activeWindows" :key="window.number" :value="window.number">
                    Window {{ window.number }}
                    {{ window.staff && (window.staff.firstName || window.staff.lastName) ? `(${window.staff.firstName} ${window.staff.lastName})` : '' }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="state-container loading-state">
          <div class="spinner"></div>
          <p>Loading appointments...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="state-container error-state">
          <div class="error-icon">⚠️</div>
          <p>{{ error }}</p>
          <button @click="loadAppointments" class="retry-btn">Retry</button>
        </div>

        <!-- No Results State -->
        <div v-else-if="filteredAppointments.length === 0" class="state-container empty-state">
          <div class="empty-illustration">
            <svg viewBox="0 0 200 120" class="empty-svg">
              <rect x="40" y="20" width="120" height="80" rx="4" fill="#e2e8f0" />
              <rect x="50" y="30" width="100" height="60" rx="2" fill="#f8fafc" />
              <rect x="60" y="40" width="15" height="15" rx="2" fill="#cbd5e0" />
              <rect x="85" y="40" width="15" height="15" rx="2" fill="#cbd5e0" />
              <rect x="110" y="40" width="15" height="15" rx="2" fill="#cbd5e0" />
              <rect x="60" y="65" width="15" height="15" rx="2" fill="#cbd5e0" />
              <rect x="85" y="65" width="15" height="15" rx="2" fill="#4fd1c5" />
              <rect x="110" y="65" width="15" height="15" rx="2" fill="#cbd5e0" />
            </svg>
          </div>
          <h4>No Appointments Found</h4>
          <p>There are no appointments scheduled for {{ formatDateDisplay(selectedDate) }}</p>
        </div>


        <!-- List View -->
        <div v-else class="list-view">
          <table class="appointments-table">
            <thead>
            <tr>
              <th @click="sortBy('timeSlot')" class="sortable time-column" :class="getSortClass('timeSlot')">
                Time <span class="sort-icon">{{ getSortIcon('timeSlot') }}</span>
              </th>
              <th @click="sortBy('customerName')" class="sortable customer-column" :class="getSortClass('customerName')">
                Customer <span class="sort-icon">{{ getSortIcon('customerName') }}</span>
              </th>
              <th class="service-column">Service</th>
              <th class="contact-column">Contact</th>
              <th class="window-column">Window</th>
              <th @click="sortBy('status')" class="sortable status-column" :class="getSortClass('status')">
                Status <span class="sort-icon">{{ getSortIcon('status') }}</span>
              </th>
              <th class="actions-column">Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="appointment in sortedAppointments"
                :key="appointment._id"
                class="appointment-row"
                :class="{
                         'selected': selectedAppointment?._id === appointment._id,
                         [`status-${appointment.status}`]: true,
                         [getAppointmentWindowClass(appointment)]: true
                }"
                @click="selectAppointment(appointment)"
            >
              <td class="time-cell">{{ formatAppointmentTime(appointment.timeSlot) }}</td>
              <td>
                <div class="customer-info">
                  <span class="customer-name">{{ appointment.customerName }}</span>
                  <span v-if="appointment.companyName" class="company-name">
                     {{ appointment.companyName }}
                  </span>
                  <span class="entity-type-badge" :class="appointment.entityType === 'Individual' ? 'individual' : 'legal'">
                     {{ appointment.entityType }}
                  </span>
                </div>
              </td>
              <td>{{ appointment.service?.type || 'N/A' }}</td>
              <td>
                <div class="contact-info">
                  <div class="phone">{{ appointment.phoneNumber }}</div>
                  <div class="email">{{ appointment.email }}</div>
                </div>
              </td>
              <td class="window-cell">
                <span v-if="appointment.windowNumber || getAssignedWindowNumber(appointment)"
                      class="window-indicator"
                      :class="getWindowIndicatorClass(appointment.windowNumber || getAssignedWindowNumber(appointment))">
                      Window {{ appointment.windowNumber || getAssignedWindowNumber(appointment) }}
                </span>
                <span v-else>-</span>
              </td>
              <td>
                <span class="status-badge" :class="appointment.status">
                  {{ appointment.status }}
                </span>
              </td>
              <td class="actions-cell">
                <!-- Action buttons remain the same -->
                <div class="action-buttons">
                  <!-- Existing buttons here -->
                </div>
              </td>
            </tr>
            </tbody>
          </table>

          <!-- Pagination Controls (for list view) -->
          <div v-if="totalPages > 1" class="pagination-controls">
            <button
                class="pagination-btn"
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1"
            >
              Prev
            </button>

            <div class="page-numbers">
              <button
                  v-for="page in displayedPages"
                  :key="page"
                  class="page-btn"
                  :class="{ active: currentPage === page }"
                  @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
                class="pagination-btn"
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Appointment Details Modal -->
    <transition name="fade">
      <div v-if="showAppointmentModal" class="modal-backdrop">
        <div class="modal">
          <div class="modal-content appointment-modal">
            <div class="modal-header">
              <h2>Appointment Details</h2>
              <button class="close-btn" @click="closeAppointmentModal">&times;</button>
            </div>

            <div class="modal-body">
              <div v-if="selectedAppointment" class="appointment-details">
                <!-- Timestamps Section with consistent edit buttons -->
                <div class="details-section">
                  <h3>Timestamps</h3>
                  <div class="detail-row" v-if="selectedAppointment.createdAt">
                    <div class="detail-label">Created:</div>
                    <div class="detail-value">{{ formatTimestamp(selectedAppointment.createdAt) }}</div>
                  </div>

                  <div class="detail-row" v-if="selectedAppointment.updatedAt">
                    <div class="detail-label">Last Updated:</div>
                    <div class="detail-value">{{ formatTimestamp(selectedAppointment.updatedAt) }}</div>
                  </div>

                  <div class="detail-row" v-if="selectedAppointment.checkinTime">
                    <div class="detail-label">Check-in Time:</div>
                    <div class="detail-value">{{ formatTimestamp(selectedAppointment.checkinTime) }}</div>
                  </div>

                  <div class="detail-row" v-if="selectedAppointment.serviceStartTime">
                    <div class="detail-label">Service Start:</div>
                    <div class="detail-value">{{ formatTimestamp(selectedAppointment.serviceStartTime) }}</div>
                  </div>

                  <div class="detail-row" v-if="selectedAppointment.completionTime">
                    <div class="detail-label">Completion:</div>
                    <div class="detail-value">{{ formatTimestamp(selectedAppointment.completionTime) }}</div>
                  </div>

                  <!-- Wait Duration with consistent edit button -->
                  <div class="detail-row">
                    <div class="detail-label">Wait Duration:</div>
                    <div class="detail-value time-edit-container">
                      <span v-if="!isEditingWaitTime" class="time-display">
                        <span class="time-value">{{ selectedAppointment.waitDuration !== undefined ? selectedAppointment.waitDuration : 'N/A' }} {{ selectedAppointment.waitDuration !== undefined ? 'minutes' : '' }}</span>
                        <button class="edit-time-btn" @click="startEditingWaitTime">
                          <span class="time-edit-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            Edit
                          </span>
                        </button>
                      </span>
                      <div v-else class="time-edit-controls">
                        <input
                            type="number"
                            v-model="tempWaitDuration"
                            class="time-input"
                            min="0"
                            max="240"
                        >
                        <div class="time-edit-actions">
                          <button class="save-time-btn" @click="saveWaitTime">Save</button>
                          <button class="cancel-time-btn" @click="cancelEditingWaitTime">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Service Duration with consistent edit button -->
                  <div class="detail-row">
                    <div class="detail-label">Service Duration:</div>
                    <div class="detail-value time-edit-container">
                      <span v-if="!isEditingServiceTime" class="time-display">
                        <span class="time-value">{{ selectedAppointment.serviceDuration !== undefined ? selectedAppointment.serviceDuration : 'N/A' }} {{ selectedAppointment.serviceDuration !== undefined ? 'minutes' : '' }}</span>
                        <button class="edit-time-btn" @click="startEditingServiceTime">
                          <span class="time-edit-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            Edit
                          </span>
                        </button>
                      </span>
                      <div v-else class="time-edit-controls">
                        <input
                            type="number"
                            v-model="tempServiceDuration"
                            class="time-input"
                            min="0"
                            max="240"
                        >
                        <div class="time-edit-actions">
                          <button class="save-time-btn" @click="saveServiceTime">Save</button>
                          <button class="cancel-time-btn" @click="cancelEditingServiceTime">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>



                <!-- Appointment and Service Info Section -->
                <div class="details-section">
                  <h3>Appointment Information</h3>
                  <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value">{{ formatAppointmentDate(selectedAppointment.timeSlot) }}</div>
                  </div>

                  <div class="detail-row">
                    <div class="detail-label">Time:</div>
                    <div class="detail-value">{{ formatAppointmentTime(selectedAppointment.timeSlot) }}</div>
                  </div>

                  <div class="detail-row">
                    <div class="detail-label">Service Type:</div>
                    <div class="detail-value">{{ selectedAppointment.service?.type || 'N/A' }}</div>
                  </div>

                  <div class="detail-row">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value">{{ selectedAppointment.service?.description || 'No description provided' }}</div>
                  </div>

                  <div class="detail-row">
                    <div class="detail-label">Status:</div>
                    <div class="detail-value">
                  <span class="status-badge-large" :class="selectedAppointment.status"
                        :style="{ backgroundColor: getStatusLightColor(selectedAppointment.status) }">
                    {{ selectedAppointment.status }}
                  </span>
                    </div>
                  </div>

                  <!-- Window selection UI with centered window indicator -->
                  <!-- Updated Window Selection Template -->
                  <div class="detail-row window-assignment">
                    <div class="detail-label">Window:</div>
                    <div class="detail-value window-select-container">
                      <span v-if="!isEditingWindow" class="window-display">
                        <span v-if="selectedAppointment.windowNumber || getAssignedWindowNumber(selectedAppointment)"
                              class="window-indicator"
                              :class="getWindowIndicatorClass(selectedAppointment.windowNumber || getAssignedWindowNumber(selectedAppointment))">
                          Window {{ selectedAppointment.windowNumber || getAssignedWindowNumber(selectedAppointment) }}
                        </span>
                        <span v-else class="no-window">-</span>
                        <button class="edit-window-btn" @click="startEditingWindow" v-if="canEditWindow(selectedAppointment)">
                          <span class="window-edit-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="3" y1="9" x2="21" y2="9"></line>
                              <line x1="9" y1="21" x2="9" y2="9"></line>
                            </svg>
                            Edit
                          </span>
                        </button>
                      </span>
                      <div v-else class="window-edit-controls">
                        <div v-if="activeWindows.length === 0" class="window-loading">
                          Loading windows...
                        </div>
                        <select v-else
                                v-model="tempSelectedWindow"
                                class="custom-select window-select"
                                @change="applyWindowSelectionAndClose">
                          <option value="" disabled>Select a window</option>
                          <option
                              v-for="window in activeWindows"
                              :key="window.number"
                              :value="window.number"
                          >
                            Window {{ window.number }}
                            {{ window.staff && (window.staff.firstName || window.staff.lastName) ?
                              `(${window.staff.firstName} ${window.staff.lastName})` : '' }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Inside the appointment details modal footer -->
            <div class="modal-footer">
              <div class="status-actions">
                <button
                    v-if="canChangeStatus(selectedAppointment, 'checked-in')"
                    class="status-btn checkin-btn-large"
                    @click="updateAppointmentStatusAndClose(selectedAppointment._id, 'checked-in')"
                >
                  Check In
                </button>

                <button
                    v-if="canChangeStatus(selectedAppointment, 'in-progress')"
                    class="status-btn progress-btn-large"
                    @click="updateAppointmentStatusAndClose(selectedAppointment._id, 'in-progress')"
                >
                  Start Service
                </button>

                <button
                    v-if="canChangeStatus(selectedAppointment, 'completed')"
                    class="status-btn complete-btn-large"
                    @click="updateAppointmentStatusAndClose(selectedAppointment._id, 'completed')"
                >
                  Complete
                </button>

                <button
                    v-if="canChangeStatus(selectedAppointment, 'scheduled') && selectedAppointment.status !== 'scheduled'"
                    class="status-btn reschedule-btn-large"
                    @click="updateAppointmentStatusAndClose(selectedAppointment._id, 'scheduled')"
                >
                  Reschedule
                </button>

                <button
                    v-if="canChangeStatus(selectedAppointment, 'no-show')"
                    class="status-btn no-show-btn-large"
                    @click="updateAppointmentStatusAndClose(selectedAppointment._id, 'no-show')"
                >
                  Mark No-Show
                </button>
              </div>
              <button class="close-modal-btn" @click="closeAppointmentModal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showStatusConfirmModal" class="modal-backdrop">
        <div class="modal">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <h3>Confirm Status Change</h3>
              <button class="close-btn" @click="cancelStatusChange">&times;</button>
            </div>

            <div class="modal-body">
              <p>Are you sure you want to change this appointment status to <strong>{{ pendingStatusChange }}</strong>?</p>

              <div v-if="pendingStatusChange === 'in-progress'" class="status-info">
                <p>Wait time will be automatically calculated based on check-in time.</p>
              </div>

              <div v-if="pendingStatusChange === 'completed'" class="status-info">
                <p>Service duration will be automatically calculated based on service start time.</p>
              </div>
            </div>

            <div class="modal-footer">
              <button class="cancel-btn" @click="cancelStatusChange">Cancel</button>
              <button class="confirm-btn" @click="confirmStatusChange">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { axiosInstance } from '@/main';
import { distributeAppointments as distributeAppointmentsUtil } from '@/utils/appointmentDistributor';


export default {
  name: 'BranchAppointments',
  data() {
    return {
      branchId: '',
      branchName: '',
      bankName: '',
      bankId: '',

      appointments: [],
      filteredAppointments: [],
      selectedDate: new Date(),
      selectedDateString: new Date().toISOString().split('T')[0],
      maxDateString: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],

      viewMode: 'list',
      loading: true,
      error: null,

      searchQuery: '',
      statusFilter: 'all',
      serviceTypeFilter: 'all',
      entityTypeFilter: 'all',
      entityTypes: [],

      sortField: 'timeSlot',
      sortDirection: 'asc',

      currentPage: 1,
      itemsPerPage: 10,

      showAppointmentModal: false,
      selectedAppointment: null,

      showStatusConfirmModal: false,
      pendingAppointmentId: null,
      pendingStatusChange: null,
      selectedWindow: null,
      serviceDuration: null,
      windows: [],
      windowAssignments: {},
      windowFilter: 'all',
      isEditingWindow: false,
      tempSelectedWindow: null,
      isWindowSaving: false,

      isEditingWaitTime: false,
      isEditingServiceTime: false,
      tempWaitDuration: null,
      tempServiceDuration: null,

      windowColors: [
        'window-color-1', 'window-color-2', 'window-color-3', 'window-color-4',
        'window-color-5', 'window-color-6', 'window-color-7', 'window-color-8'
      ],
      windowIndicatorColors: [
        'window-indicator-1', 'window-indicator-2', 'window-indicator-3', 'window-indicator-4',
        'window-indicator-5', 'window-indicator-6', 'window-indicator-7', 'window-indicator-8'
      ],

      activeWindows: [],

      // Reference data
      serviceTypes: [],

      // Bank logos mapping
      bankLogos: {
        'Acba Bank': '/logos/acba.png',
        'Ameriabank': '/logos/ameriabank.png',
        'AMIO bank': '/logos/amio.png',
        'Araratbank': '/logos/araratbank.png',
        'Ardshinbank': '/logos/ardshinbank.png',
        'Ardshininvestbank': '/logos/ardshinbank.png',
        'Armeconombank': '/logos/armeconombank.jpg',
        'Artsakhbank': '/logos/artsakhbank.png',
        'Byblos Bank Armenia': '/logos/byblos.webp',
        'Converse Bank': '/logos/converse.jpg',
        'Evocabank': '/logos/evocabank.png',
        'Fast Bank': '/logos/fast.jpeg',
        'ID Bank': '/logos/idbank.png',
        'Idram': '/logos/idram.png',
        'Inecobank': '/logos/inecobank.png',
        'VTB Bank (Armenia)': '/logos/vtb.png'
      },

      // Time slots for calendar view (9 AM to 6 PM)
      timeSlots: Array.from({ length: 10 }, (_, i) => ({
        hour: i + 9,
        label: `${i + 9}:00`
      }))
    };
  },

  watch: {
    activeWindows(newVal) {
      console.log('Active windows updated:', newVal);
    },
    tempSelectedWindow(newVal) {
      console.log('Selected window changed to:', newVal);
    }
  },

  computed: {
    // Filter and sort appointments
    sortedAppointments() {
      // Apply pagination on filtered appointments
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      return this.filteredAppointments.slice(startIndex, endIndex);
    },

    // Pagination
    totalPages() {
      return Math.ceil(this.filteredAppointments.length / this.itemsPerPage);
    },

    // Generate page numbers to display
    displayedPages() {
      const range = 2; // Show 2 pages before and after current page
      const pages = [];

      // Always include first page
      pages.push(1);

      // Generate range around current page
      for (let i = Math.max(2, this.currentPage - range); i <= Math.min(this.totalPages - 1, this.currentPage + range); i++) {
        pages.push(i);
      }

      // Always include last page if there is more than one page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }

      // Filter out duplicates and sort
      return [...new Set(pages)].sort((a, b) => a - b);
    },

    // HTTP Authorization headers
    authHeaders() {
      return {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('branchToken')}`
        }
      };
    }
  },

  mounted() {
    // Load branch information from localStorage
    this.loadBranchInfo();

    // Initialize empty arrays to prevent errors
    this.windows = [];
    this.windowAssignments = {};

    // Load initial data
    this.loadAppointments();
    this.loadServiceTypes();
    this.loadActiveWindows();

    // Set up auto refresh every 2 minutes
    this.refreshInterval = setInterval(() => {
      this.loadAppointments();
      this.loadActiveWindows();
    }, 120000);
  },

  beforeUnmount() {
    // Clear any intervals
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },

  methods: {
    loadBranchInfo() {
      this.branchId = localStorage.getItem('branchId');
      this.branchName = localStorage.getItem('branchName');
      this.bankName = localStorage.getItem('bankName');
      this.bankId = localStorage.getItem('bankId');

      if (!this.branchId || !this.bankId) {
        this.$router.push({ name: 'BranchLogin' });
      } else {
        this.fetchEntityTypes();
      }
    },

    async fetchEntityTypes() {
      try {
        const response = await axiosInstance.get(
            `/banks/${this.bankId}/entityTypes`,
            this.authHeaders
        );
        this.entityTypes = response.data || [];
        console.log('Fetched entity types:', this.entityTypes);
      } catch (error) {
        console.error('Error fetching entity types:', error);
        this.entityTypes = [];
      }
    },

    startEditingWaitTime() {
      this.tempWaitDuration = this.selectedAppointment.waitDuration || 0;
      this.isEditingWaitTime = true;
    },
    cancelEditingWaitTime() {
      this.isEditingWaitTime = false;
      this.tempWaitDuration = null;
    },
    async saveWaitTime() {
      if (this.tempWaitDuration === null || this.tempWaitDuration === '') {
        alert('Please enter a valid duration');
        return;
      }
      try {
        const waitDuration = parseInt(this.tempWaitDuration);
        console.log('Saving wait duration:', waitDuration);
        console.log('Appointment ID:', this.selectedAppointment._id);
        const payload = {
          waitDuration: waitDuration,
          status: this.selectedAppointment.status // Keep current status
        };
        console.log('Sending payload:', payload);
        const response = await axiosInstance.put(
            `/appointments/${this.selectedAppointment._id}/status`,
            payload,
            this.authHeaders
        );
        console.log('Wait duration update response:', response.data);
        this.selectedAppointment.waitDuration = waitDuration;
        this.isEditingWaitTime = false;
        await this.loadAppointments();
      } catch (error) {
        console.error('Error updating wait duration:', error);
        if (error.response) {
          console.error('Server response:', error.response.data);
          console.error('Status code:', error.response.status);
        }
        alert('Failed to update wait duration: ' + (error.response?.data?.error || error.message));
      }
    },

    getDisplayStatus(status) {
      return status === 'checked-in' ? 'waiting' : status;
    },


    startEditingServiceTime() {
      this.tempServiceDuration = this.selectedAppointment.serviceDuration || 0;
      this.isEditingServiceTime = true;
    },
    cancelEditingServiceTime() {
      this.isEditingServiceTime = false;
      this.tempServiceDuration = null;
    },
    async saveServiceTime() {
      if (this.tempServiceDuration === null || this.tempServiceDuration === '') {
        alert('Please enter a valid duration');
        return;
      }
      try {
        const serviceDuration = parseInt(this.tempServiceDuration);
        await axiosInstance.put(
            `/appointments/${this.selectedAppointment._id}/status`,
            {
              serviceDuration: serviceDuration,
              status: this.selectedAppointment.status
            },
            this.authHeaders
        );
        this.selectedAppointment.serviceDuration = serviceDuration;
        this.isEditingServiceTime = false;

        this.loadAppointments();
      } catch (error) {
        console.error('Error updating service duration:', error);
        alert('Failed to update service duration: ' + (error.response?.data?.error || error.message));
      }
    },

    async applyWindowSelectionAndClose() {
      if (!this.tempSelectedWindow || !this.selectedAppointment) {
        this.isEditingWindow = false;
        return;
      }
      try {
        const windowNumber = parseInt(this.tempSelectedWindow, 10);
        await axiosInstance.put(
            `/appointments/${this.selectedAppointment._id}/status`,
            {
              windowNumber: windowNumber,
              status: this.selectedAppointment.status
            },
            this.authHeaders
        );
        if (this.selectedAppointment.status === 'in-progress') {
          await axiosInstance.put(
              `/branch/${this.branchId}/windows/${windowNumber}`,
              {
                status: 'serving',
                currentAppointment: this.selectedAppointment._id
              },
              this.authHeaders
          );
        }
        this.selectedAppointment.windowNumber = windowNumber;
        this.isEditingWindow = false;
        this.loadAppointments();
        this.loadActiveWindows();
      } catch (error) {
        console.error('Error updating window:', error);
        alert('Failed to update window. Please try again.');
        this.isEditingWindow = false; // Close edit mode even on error
      }
    },


    canEditWindow(appointment) {
      if (!appointment) return false;
      return ['scheduled', 'waiting', 'checked-in', 'in-progress'].includes(appointment.status);
    },
    startEditingWindow() {
      this.loadActiveWindows().then(() => {
        this.tempSelectedWindow = this.selectedAppointment.windowNumber ||
            this.getAssignedWindowNumber(this.selectedAppointment) ||
            '';
        this.isEditingWindow = true;
      });
    },

    getStatusLightColor(status) {
      const colors = {
        'scheduled': '#b2f5ea',  // Light teal
        'waiting': '#c6f6d5',    // Light orange
        'checked-in': '#c6f6d5', // Light green
        'in-progress': '#bee3f8', // Light blue
        'completed': '#e9d8fd',  // Light purple
        'no-show': '#fed7d7'    // Light red
      };
      return colors[status] || '#ebf8ff'; // Default light blue
    },

    getWindowIndicatorClass(windowNumber) {
      if (!windowNumber) return '';
      if (!this.windowIndicatorColors || !Array.isArray(this.windowIndicatorColors) ||
          this.windowIndicatorColors.length === 0) {
        return '';
      }
      const colorIndex = (windowNumber - 1) % this.windowIndicatorColors.length;
      return this.windowIndicatorColors[colorIndex];
    },

    distributeAppointments() {
      if (!this.windows || !this.appointments || !Array.isArray(this.windows) || !Array.isArray(this.appointments)) {
        console.log("Windows or appointments not loaded yet, skipping distribution");
        return {};
      }

      try {
        this.windowAssignments = distributeAppointmentsUtil(
            this.appointments,
            this.windows
        );
        this.$nextTick(() => this.$forceUpdate());
        return this.windowAssignments;
      } catch (error) {
        console.error("Error distributing appointments:", error);
        this.windowAssignments = {};
        return {};
      }
    },

    getAppointmentWindowClass(appointment) {
      if (!appointment) return '';
      const windowNumber = this.getAssignedWindowNumber(appointment);
      if (!windowNumber) return '';
      if (!this.windowColors || !Array.isArray(this.windowColors) || this.windowColors.length === 0) {
        return '';
      }
      const colorIndex = (windowNumber - 1) % this.windowColors.length;
      return this.windowColors[colorIndex];
    },

    getAssignedWindowNumber(appointment) {
      if (!appointment) return null;
      if (appointment.windowNumber) return appointment.windowNumber;
      if (!this.windowAssignments || typeof this.windowAssignments !== 'object') {
        return null;
      }
      for (const [windowNumber, appointments] of Object.entries(this.windowAssignments)) {
        if (appointments && Array.isArray(appointments) &&
            appointments.some(a => a._id === appointment._id)) {
          return Number(windowNumber);
        }
      }
      return null;
    },

    async loadAppointments() {
      this.loading = true;
      this.error = null;

      try {
        const formattedDate = this.formatDateForAPI(this.selectedDate);
        const response = await axiosInstance.get(
            `/branch-dashboard/appointments/${formattedDate}`,
            this.authHeaders
        );
        this.appointments = response.data || [];
        this.applyFilters();
        if (this.windows && this.windows.length > 0) {
          this.distributeAppointments();
        }
        this.currentPage = 1;
      } catch (error) {
        console.error('Error loading appointments:', error);

        if (error.response && error.response.status === 401) {
          this.error = 'Your session has expired. Please log in again.';
          setTimeout(() => {
            this.$router.push({ name: 'BranchLogin' });
          }, 2000);
        } else {
          this.error = 'Failed to load appointments. Please try again.';
        }
      } finally {
        this.loading = false;
      }
    },


    async loadServiceTypes() {
      try {
        const response = await axiosInstance.get(`/banks/${this.bankId}/deals`, this.authHeaders);
        const serviceTypeSet = new Set();
        response.data.forEach(deal => {
          deal.dealTypes.forEach(dt => {
            serviceTypeSet.add(dt.serviceType);
          });
        });

        this.serviceTypes = Array.from(serviceTypeSet);
      } catch (error) {
        console.error('Error loading service types:', error);
      }
    },

    async loadActiveWindows() {
      try {
        const response = await axiosInstance.get(`/branch/${this.branchId}/windows`, this.authHeaders);
        this.activeWindows = (response.data || []).filter(window =>
            window.status === 'active' || window.status === 'serving'
        );
        this.windows = response.data || [];
        if (this.appointments && this.appointments.length > 0) {
          this.distributeAppointments();
        }
        return this.activeWindows;
      } catch (error) {
        console.error('Error loading windows:', error);
        this.activeWindows = [];
        this.windows = [];
        return [];
      }
    },

    changeDate(days) {
      const newDate = new Date(this.selectedDate);
      newDate.setDate(newDate.getDate() + days);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);

      if (newDate > maxDate) {
        newDate.setTime(maxDate.getTime());
      }
      this.selectedDate = newDate;
      this.selectedDateString = this.formatDateForAPI(newDate);
      this.loadAppointments();
    },

    goToToday() {
      this.selectedDate = new Date();
      this.selectedDateString = this.formatDateForAPI(this.selectedDate);
      this.loadAppointments();
    },

    applyFilters() {
      this.filteredAppointments = this.appointments.filter(appointment => {
        if (this.statusFilter !== 'all') {
          if (this.statusFilter === 'waiting') {
            if (appointment.status !== 'waiting' && appointment.status !== 'checked-in') {
              return false;
            }
          } else if (appointment.status !== this.statusFilter) {
            return false;
          }
        }
        if (this.entityTypeFilter !== 'all' &&
            appointment.entityType !== this.entityTypeFilter) {
          return false;
        }
        if (this.serviceTypeFilter !== 'all' &&
            appointment.service?.type !== this.serviceTypeFilter) {
          return false;
        }
        if (this.windowFilter !== 'all') {
          const windowNumber = appointment.windowNumber || this.getAssignedWindowNumber(appointment);
          if (windowNumber !== parseInt(this.windowFilter)) {
            return false;
          }
        }

        if (this.searchQuery && this.searchQuery.trim() !== '') {
          const query = this.searchQuery.toLowerCase();
          const nameMatch = appointment.customerName?.toLowerCase().includes(query);
          const phoneMatch = appointment.phoneNumber?.toLowerCase().includes(query);
          const emailMatch = appointment.email?.toLowerCase().includes(query);
          const companyMatch = appointment.companyName?.toLowerCase().includes(query);

          return nameMatch || phoneMatch || emailMatch || companyMatch;
        }
        return true;
      });
      this.sortAppointments();
      this.currentPage = 1;
    },

    handleSearch() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.applyFilters();
      }, 300);
    },

    clearSearch() {
      this.searchQuery = '';
      this.applyFilters();
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortField = field;
        this.sortDirection = 'asc';
      }
      this.sortAppointments();
    },

    sortAppointments() {
      this.filteredAppointments.sort((a, b) => {
        let valueA, valueB;

        if (this.sortField === 'timeSlot') {
          valueA = this.getTimeValue(a.timeSlot);
          valueB = this.getTimeValue(b.timeSlot);
        } else {
          valueA = a[this.sortField] || '';
          valueB = b[this.sortField] || '';
        }

        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (this.sortDirection === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    },

    getTimeValue(timeSlot) {
      if (!timeSlot) return 0;

      try {
        if (typeof timeSlot === 'string' && timeSlot.includes('/')) {
          const parts = timeSlot.split('/');
          if (parts.length >= 5) {
            const hour = parseInt(parts[3]);
            const minute = parseInt(parts[4]);
            return hour * 60 + minute;
          }
        }

        if (timeSlot instanceof Date) {
          return timeSlot.getHours() * 60 + timeSlot.getMinutes();
        }
        return 0;
      } catch (e) {
        console.error('Error getting time value:', e);
        return 0;
      }
    },

    getSortClass(field) {
      return this.sortField === field ? `sorted ${this.sortDirection}` : '';
    },

    getSortIcon(field) {
      if (this.sortField !== field) return '⇅';
      return this.sortDirection === 'asc' ? '▲' : '▼';
    },

    goToPage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
    },

    selectAppointment(appointment) {
      this.selectedAppointment = { ...appointment };
      this.showAppointmentModal = true;
    },

    closeAppointmentModal() {
      this.showAppointmentModal = false;
      this.selectedAppointment = null;
    },

    canChangeStatus(appointment, newStatus) {
      if (!appointment) return false;
      const currentStatus = appointment.status;

      const validTransitions = {
        'scheduled': ['checked-in', 'in-progress', 'no-show'],
        'waiting': ['checked-in', 'in-progress', 'no-show', 'scheduled'],
        'checked-in': ['in-progress', 'no-show',  'scheduled'],
        'in-progress': ['completed', 'no-show', 'scheduled'],
        'completed': ['in-progress', 'scheduled'],
        'no-show': ['scheduled', 'checked-in', 'in-progress']
      };

      return validTransitions[currentStatus]?.includes(newStatus) || false;
    },

    updateAppointmentStatus(appointmentId, newStatus) {
      this.pendingAppointmentId = appointmentId;
      this.pendingStatusChange = newStatus;
      this.serviceDuration = null;
      this.showStatusConfirmModal = true;
    },

    updateAppointmentStatusAndClose(appointmentId, newStatus) {
      this.updateAppointmentStatus(appointmentId, newStatus);
    },

    async confirmStatusChange() {
      try {
        const payload = {
          status: this.pendingStatusChange
        };
        if (this.pendingStatusChange === 'in-progress') {
          const appointment = this.appointments.find(a => a._id === this.pendingAppointmentId);
          if (appointment) {
            const windowNumber = appointment.windowNumber || this.getAssignedWindowNumber(appointment);
            if (windowNumber) {
              payload.windowNumber = windowNumber;
            }
          }
        }
        console.log('Updating appointment status:', payload);

        await axiosInstance.put(
            `/appointments/${this.pendingAppointmentId}/status`,
            payload,
            this.authHeaders
        );
        if (this.pendingStatusChange === 'in-progress' && payload.windowNumber) {
          await axiosInstance.put(
              `/branch/${this.branchId}/windows/${payload.windowNumber}`,
              {
                status: 'serving',
                currentAppointment: this.pendingAppointmentId
              },
              this.authHeaders
          );
        }
        this.loadAppointments();
        this.loadActiveWindows();

        this.cancelStatusChange();
        this.closeAppointmentModal();
      } catch (error) {
        console.error('Error updating appointment status:', error);
        alert('Failed to update appointment status: ' + (error.response?.data?.error || error.message));
      }
    },

    cancelStatusChange() {
      this.showStatusConfirmModal = false;
      this.pendingAppointmentId = null;
      this.pendingStatusChange = null;
      this.serviceDuration = null;
    },

    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDateDisplay(date) {
      if (!date) return '';
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    },

    formatAppointmentTime(timeSlot) {
      if (!timeSlot) return 'N/A';

      try {
        // Handle "DD/MM/YY/HH/MM" format
        if (typeof timeSlot === 'string' && timeSlot.includes('/')) {
          const parts = timeSlot.split('/');
          if (parts.length >= 5) {
            const hour = parts[3].padStart(2, '0');
            const minute = parts[4].padStart(2, '0');
            return `${hour}:${minute}`;
          }
        }
        if (timeSlot instanceof Date) {
          return timeSlot.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
        return 'N/A';
      } catch (e) {
        console.error('Error formatting time:', e);
        return 'N/A';
      }
    },

    formatAppointmentDate(timeSlot) {
      if (!timeSlot) return 'N/A';

      try {
        // Handle "DD/MM/YY/HH/MM" format
        if (typeof timeSlot === 'string' && timeSlot.includes('/')) {
          const parts = timeSlot.split('/');
          if (parts.length >= 5) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = `20${parts[2].padStart(2, '0')}`;
            return `${day}/${month}/${year}`;
          }
        }
        if (timeSlot instanceof Date) {
          return timeSlot.toLocaleDateString();
        }
        return 'N/A';
      } catch (e) {
        console.error('Error formatting date:', e);
        return 'N/A';
      }
    },

    formatTimestamp(timestamp) {
      if (!timestamp) return 'N/A';

      try {
        const date = new Date(timestamp);
        return date.toLocaleString();
      } catch (e) {
        return 'Invalid timestamp';
      }
    },

    getBankLogo(bankName) {
      return this.bankLogos[bankName] || '/logos/default-bank.png';
    },

    navigateToDashboard() {
      this.$router.push({ name: 'BranchDashboard' });
    },

    navigateToReports() {
      this.$router.push({ name: 'BranchReports' });
    },

    navigateToSettings() {
      this.$router.push({ name: 'BranchSettings' });
    },

    logout() {
      localStorage.removeItem('branchToken');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchName');
      localStorage.removeItem('bankName');
      localStorage.removeItem('bankId');
      this.$router.push({ name: 'BranchLogin' });
    }
  }
};
</script>

<style scoped>

.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f6f8fa;
  font-family: Arial, sans-serif;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #42b983;
  padding: 0.8rem 1.5rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.branch-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bank-name {
  font-weight: bold;
}

.branch-name {
  font-size: 0.9rem;
  opacity: 0.9;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dashboard-content {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background-color: #1e2938;
  color: #eaeaea;
  padding: 1.5rem 0;
}
.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu li {
  padding: 0.8rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.sidebar-menu li:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-menu li.active {
  background-color: #42b983;
  color: white;
  font-weight: bold;
}

.sidebar-menu .icon {
  margin-right: 12px;
  font-size: 1.1rem;
}

.branch-details {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
}

.bank-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
  background: #1e2938;
  border-radius: 8px;
  padding: 2px;
}

.branch-text h3 {
  margin: 0;
  font-size: 1.1rem;
}

.branch-text p {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0;
  color: #1a202c;
  font-size: 1.8rem;
  font-weight: 700;
}

.section-subtitle {
  margin: 0.25rem 0 0;
  color: #718096;
  font-size: 1rem;
}

.header-actions {
  display: grid;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 400px;
  min-width: 250px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-box input {
  padding: 0.7rem 1rem;
  padding-right: 3rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #38b2ac;
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.2);
}

.clear-search {
  position: absolute;
  right: 2.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #a0aec0;
  font-size: 1.2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn {
  position: absolute;
  right: 0.7rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #4a5568;
}

.controls-container {
  background-color: white;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #c8e6c9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-btn:hover {
  background-color: #42b983;
  border-color: #cbd5e0;
}

.today-btn {
  padding: 0.5rem 1.2rem;
  background-color: #c8e6c9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  margin-left: auto;
}

.today-btn:hover {
  background-color: #42b983;
}

.date-display {
  padding: 0.5rem 1rem;
  background-color: #c8e6c9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  min-width: 200px;
  text-align: center;
  font-weight: 500;
}

.filters-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filters-title {
  margin: 0;
  color: #4a5568;
  font-size: 1rem;
  font-weight: 600;
}

.filters-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 180px;
}

.filter-item label {
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
}

.custom-select {
  appearance: none;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234a5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
  padding-right: 2.5rem;
  width: 100%;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.custom-select:focus {
  outline: none;
  border-color: #38b2ac;
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.2);
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background-color: white;
  border-radius: 10px;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-state .spinner {
  border: 3px solid #edf2f7;
  border-top: 3px solid #38b2ac;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  border: 1px solid #fed7d7;
  background-color: #fff5f5;
}

.error-state .error-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #e53e3e;
}

.retry-btn {
  padding: 0.6rem 1.5rem;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  margin-top: 1.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn:hover {
  background-color: #c53030;
}

.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
  transition: all 0.3s ease;
}

.empty-illustration {
  margin: 0 auto 2rem;
  max-width: 180px;
  opacity: 0.8;
}

.empty-svg {
  width: 100%;
  height: auto;
}

.empty-state h4 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  color: #2d3748;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 2rem;
  color: #718096;
  font-size: 1.1rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.list-view {
  overflow: hidden;
}

.appointments-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.appointments-table th,
.appointments-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.time-column {
  width: 10%;
}

.customer-column {
  width: 25%;
}

.service-column {
  width: 20%;
}

.contact-column {
  width: 25%;
}

.status-column {
  width: 20%;
}

.appointment-row td {
  border-bottom: 1px solid #e2e8f0 !important;
  height: 40px; /* Set a consistent minimum height */
  max-height: 60px; /* Limit maximum height */
  overflow: hidden;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #edf2f7;
}

.sorted.asc .sort-icon::after {
  content: '▲';
  color: #38b2ac;
}

.sorted.desc .sort-icon::after {
  content: '▼';
  color: #38b2ac;
}

.appointment-row {
  cursor: pointer;
  transition: all 0.2s;
}

.appointment-row:hover {
  background-color: #f7fafc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.appointment-row.selected {
  background-color: #e6fffa;
  border-left: 3px solid #38b2ac;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.customer-name {
  font-weight: 500;
  color: #2d3748;
}

.company-name {
  font-size: 0.85rem;
  color: #718096;
}

.entity-type-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  display: inline-block;
  margin-top: 0.2rem;
  width: fit-content;
}

.entity-type-badge.individual {
  background-color: #ebf8ff;
  color: #2b6cb0;
}

.entity-type-badge.legal {
  background-color: #fff5f5;
  color: #c53030;
}

.contact-info {
  max-width: 100%;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phone {
  color: #2d3748;
}

.email {
  color: #718096;
  font-size: 0.85rem;
}

.window-column {
  width: 15%;
}

.window-cell {
  text-align: center;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 1rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #edf2f7;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.3rem;
}

.page-btn {
  min-width: 32px;
  padding: 0.5rem;
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background-color: #edf2f7;
}

.page-btn.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.window-select-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.window-display {
  display: flex;
  width: 100%;
  align-items: center;
}

.edit-window-btn {
  margin-left: auto;
  background-color: #f0f0f0;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  opacity: 0.9;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #4a5568;
  height: 30px;
}

.edit-window-btn:hover {
  opacity: 1;
  background-color: #e8e8e8;
}

.window-edit-icon {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.window-edit-icon svg {
  width: 14px;
  height: 14px;
}

.window-edit-controls {
  display: flex;
  align-items: center;
  width: 100%;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 90%;
  display: flex;
  justify-content: center;
}

.modal-content {
  background-color: white;
  border-radius: 10px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.appointment-modal {
  max-width: 800px;
}

.confirmation-modal {
  max-width: 500px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
}

.modal-header h2, .modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #a0aec0;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  color: #4a5568;
}

.modal-body {
  padding: 1.5rem;
}

.appointment-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.details-section {
  margin-bottom: 1.5rem;
}

.details-section h3 {
  margin-bottom: 1rem;
  color: #2d3748;
  font-size: 1.1rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
  font-weight: 600;
}

.detail-row {
  display: flex;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
  align-items: center;
}


.detail-label {
  font-weight: 500;
  color: #4a5568;
  width: 130px;
  min-width: 130px;
  padding-right: 10px;
  text-align: right;
}

.detail-value {
  flex: 1;
  color: #2d3748;
}


.detail-value a:hover {
  text-decoration: underline;
}

.status-badge-large {
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  text-transform: capitalize;
  display: inline-block;
  font-weight: 500;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-actions {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.status-btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.checkin-btn-large {
  background-color: #42b983;
  color: white;
}

.checkin-btn-large:hover {
  background-color: #3aa876;
}

.no-show-btn-large {
  background-color: #42b983;
  color: white;
}

.no-show-btn-large:hover {
  background-color: #971f1f;
}

.close-modal-btn {
  padding: 0.6rem 1.2rem;
  background-color: #edf2f7;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.close-modal-btn:hover {
  background-color: #e2e8f0;
}

.confirmation-modal .modal-body {
  padding: 1.5rem;
}

.confirmation-modal p {
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.service-duration-input label,
.window-selection label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.service-duration-input input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s;
}

.service-duration-input input:focus,
.window-selection select:focus {
  outline: none;
  border-color: #38b2ac;
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.2);
}

.confirmation-modal .modal-footer {
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.6rem 1.2rem;
  background-color: #edf2f7;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.8rem;
  font-weight: 500;
}

.cancel-btn:hover {
  background-color: #e2e8f0;
}

.window-color-1 {
  border-left: 4px solid #8B5CF6 !important;
}

.window-color-2 {
  border-left: 4px solid #00D2F6 !important;
}

.window-color-3 {
  border-left: 4px solid #FF6B35 !important;
}

.window-color-4 {
  border-left: 4px solid #10B981 !important;
}

.window-color-5 {
  border-left: 4px solid #DB00FF !important;
}

.window-color-6 {
  border-left: 4px solid #FACC15 !important;
}

.window-color-7 {
  border-left: 4px solid #2563EB !important;
}

.window-color-8 {
  border-left: 4px solid #FF7F50 !important;
}

.window-indicator-1 {
  background-color: #8B5CF6 !important;
}

.window-indicator-2 {
  background-color: #00D2F6 !important;
}

.window-indicator-3 {
  background-color: #FF6B35 !important;
}

.window-indicator-4 {
  background-color: #10B981 !important;
}

.window-indicator-5 {
  background-color: #DB00FF !important;
}

.window-indicator-6 {
  background-color: #FACC15 !important;
}

.window-indicator-7 {
  background-color: #2563EB !important;
}

.window-indicator-8 {
  background-color: #FF7F50 !important;
}



.status-badge.scheduled,
.status-badge-large.scheduled {
  background-color: #b2f5ea;
  color: #234e52;
}

.status-badge.waiting,
.status-badge.checked-in,
.status-badge-large.waiting,
.status-badge-large.checked-in {
  background-color: #bee3f8;
  color: #2b6cb0;
}


.status-badge.in-progress,
.status-badge-large.in-progress {
  background-color: #feebc8;
  color: #c05621;
}

.status-badge.completed,
.status-badge-large.completed {
  background-color: #c6f6d5;
  color: #22543d;
}

.status-badge.no-show,
.status-badge-large.no-show {
  background-color: #fed7d7;
  color: #c53030;
}

.status-badge,
.status-badge-large {
  background-color: #e2e8f0;
  color: #4a5568;
}



.window-cell {
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  text-transform: capitalize;
  display: inline-flex;
  font-weight: 500;
  align-items: center;
}

.confirm-btn {
  padding: 0.6rem 1.2rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.confirm-btn:hover {
  background-color: #3aa876;
}

.confirm-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}


.progress-btn-large {
  background-color: #42b983;
  color: white;
}

.progress-btn-large:hover {
  background-color: #3aa876;
}

.complete-btn-large {
  background-color: #42b983;
  color: white;
}

.complete-btn-large:hover {
  background-color: #3aa876;
}

.reschedule-btn-large {
  background-color: #42b983;
  color: white;
}

.reschedule-btn-large:hover {
  background-color: #3aa876;
}


@media (max-width: 1024px) {
  .dashboard-content {
    flex-direction: column;
    height: auto;
  }

  .sidebar {
    width: 100%;
    max-height: 300px;
  }

  .branch-details {
    padding: 1rem;
  }

  .appointment-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    max-width: none;
    width: 100%;
  }

  .date-navigation {
    flex-direction: column;
    width: 100%;
  }

  .date-display {
    width: 100%;
  }

  .today-btn {
    width: 100%;
  }

  .filters-section {
    gap: 0.8rem;
  }

  .filters-group {
    flex-direction: column;
    width: 100%;
  }

  .filter-item {
    width: 100%;
  }


  .appointments-table {
    display: block;
    overflow-x: auto;
  }

  .modal-content {
    width: 95%;
    margin: 0 auto;
  }

  .status-actions {
    width: 100%;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .close-modal-btn {
    width: 100%;
    margin-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .navbar {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.8rem;
  }

  .branch-info {
    width: 100%;
    margin: 0.5rem 0;
  }

  .nav-actions {
    width: 100%;
  }

  .logout-btn {
    width: 100%;
    justify-content: center;
  }

  .sidebar-menu li {
    padding: 0.8rem 1rem;
  }

  .main-content {
    padding: 1rem;
  }

  .pagination-controls {
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .pagination-btn, .page-btn {
    font-size: 0.9rem;
    padding: 0.4rem;
    min-width: 28px;
  }
}

.window-loading {
  font-style: italic;
  color: #718096;
  margin-bottom: 0.5rem;
}

.window-indicator {
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: auto;
}

.no-window {
  flex: 1;
  text-align: center;
}

.window-select {
  min-width: 200px;
  width: 100%;
  height: 36px;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  font-size: 0.95rem;
  transition: all 0.2s;
  cursor: pointer;
}

.window-select:focus {
  outline: none;
  border-color: #38b2ac;
  box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.debug-mode .window-select {
  outline: 2px solid red;
}

.status-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #38b2ac;
}


.status-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #4a5568;
  line-height: 1.4;
}

.time-display {
  display: flex;
  width: 100%;
  align-items: center;
}

.edit-time-btn {
  margin-left: auto;
  background-color: #f0f0f0;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  opacity: 0.9;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #4a5568;
  height: 30px;
}

.edit-time-btn:hover {
  opacity: 1;
  background-color: #e8e8e8;
}

.time-edit-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.time-edit-icon svg {
  width: 14px;
  height: 14px;
}

.time-edit-controls {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
  align-items: center;
}

.time-input {
  min-width: 40px;
  width: 30px;
  padding: 0.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
  height: 20px;
}

.time-edit-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}


.save-time-btn,
.cancel-time-btn{
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-time-btn {
  background-color: #42b983;
  color: white;
  flex: 1;
}

.save-time-btn:hover{
  background-color: #3aa876;
}

.cancel-time-btn {
  background-color: #e2e8f0;
  color: #4a5568;
  flex: 1;
}

.cancel-time-btn:hover {
  background-color: #cbd5e0;
}

.time-edit-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.window-display,
.time-display {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.window-indicator,
.time-display > span:first-child {
  flex: 1;
  text-align: center;
  justify-content: center;
}

.edit-window-btn,
.edit-time-btn {
  margin-left: 8px;
  background-color: #f0f0f0;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  opacity: 0.9;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #4a5568;
}

.edit-window-btn:hover,
.edit-time-btn:hover {
  opacity: 1;
  background-color: #e8e8e8;
}

.time-value {
  text-align: left;
  flex-grow: 0;
  margin-right: auto;
}

.window-edit-icon svg,
.time-edit-icon svg {
  width: 14px;
  height: 14px;
}

.window-edit-actions {
  display: none !important;
}



</style>