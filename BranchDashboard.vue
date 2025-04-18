<template>
  <div class="dashboard-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <h1 class="logo">InQueue</h1>
      <div class="branch-info">
        <span class="bank-name">{{ bankName }}</span>
        <span class="branch-name">{{ branchName }}</span>
      </div>
      <div class="nav-actions">
        <button class="logout-btn" @click="logout">Logout</button>
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
          <li class="active"><span class="icon">📊</span>Dashboard</li>
          <li @click="navigateToAppointments"><span class="icon">🗓️</span>Appointments</li>
          <li @click="navigateToReports"><span class="icon">📈</span>Reports</li>
          <li @click="navigateToSettings"><span class="icon">⚙️</span>Settings</li>
        </ul>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header Stats -->
        <div class="stats-header">
          <div class="stat-card">
            <h4>Today's Appointments</h4>
            <div class="stat-value">{{ stats.todayTotal || 0 }}</div>
          </div>
          <div class="stat-card">
            <h4>Waiting</h4>
            <div class="stat-value">{{ stats.waiting || 0 }}</div>
          </div>
          <div class="stat-card">
            <h4>In Progress</h4>
            <div class="stat-value">{{ stats.inProgress || 0 }}</div>
          </div>
          <div class="stat-card">
            <h4>Completed</h4>
            <div class="stat-value">{{ stats.served }}</div>
          </div>
          <div class="stat-card">
            <h4>No Shows</h4>
            <div class="stat-value">{{ stats.noShows }}</div>
          </div>
        </div>

        <!-- Windows & Deal Types Management -->
        <div class="windows-section">
          <div class="section-header">
            <h3>Windows</h3>
            <button class="add-window-btn" @click="showAddWindow">Add Window</button>
          </div>

          <div v-if="windows.length === 0" class="empty-state">
            <div class="empty-icon">🪟</div>
            <p>No windows configured yet</p>
            <p>Add windows to start managing client flow</p>
          </div>

          <div v-else class="windows-grid">
            <div
                v-for="window in windows"
                :key="window.number"
                class="window-card"
                :class="{
                  'active': window.status === 'active',
                  'serving': window.status === 'serving',
                  'inactive': window.status === 'inactive',
                  [getWindowBorderClass(window)]: true // Always apply border class
                }"
            >
              <div class="window-header">
                <h4>Window {{ window.number }}</h4>
                <div class="window-status">{{ window.status }}</div>
              </div>

              <!-- Staff Information -->
              <div class="staff-info">
                <div v-if="window.staff && (window.staff.firstName || window.staff.lastName)" class="staff-name">
                  <span class="staff-label">Staff:</span>
                  {{ window.staff.firstName }} {{ window.staff.lastName }}
                </div>
              </div>

              <div class="window-content">
                <div class="deal-types">
                  <h5>Deal Types:</h5>
                  <div v-if="window.dealTypes.length === 0" class="no-deal-types">
                    No deal types assigned
                  </div>
                  <ul v-else>
                    <li v-for="dealType in window.dealTypes" :key="dealType">{{ dealType }}</li>
                  </ul>
                </div>

                <div class="window-actions">
                  <button
                      v-if="window.status === 'inactive'"
                      class="activate-btn"
                      @click="activateWindow(window.number)"
                  >
                    Activate
                  </button>
                  <button
                      v-else-if="window.status === 'active'"
                      class="deactivate-btn"
                      @click="deactivateWindow(window.number)"
                  >
                    Deactivate
                  </button>
                  <button
                      class="edit-btn"
                      @click="editWindow(window)"
                  >
                    Edit
                  </button>
                  <button
                      class="delete-btn"
                      @click="confirmDeleteWindow(window.number)"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div v-if="window.currentAppointment" class="current-appointment">
                <h5>Current Client:</h5>
                <p>{{ getAppointmentDetails(window.currentAppointment) }}</p>
                <button class="complete-btn" @click="completeAppointment(window.number)">Complete</button>
              </div>

              <!-- Upcoming clients section for this window -->
              <div class="window-upcoming-clients">
                <h5>Upcoming Clients: {{ getWindowUpcomingCount(window) }}</h5>
                <div v-if="getWindowUpcomingAppointments(window).length === 0" class="no-upcoming">
                  No upcoming clients
                </div>
                <div v-else class="upcoming-preview">
                  <div
                      v-for="(appointment) in getWindowUpcomingAppointments(window).slice(0, 3)"
                      :key="appointment._id"
                      class="mini-appointment"
                  >
                    {{ formatAppointmentTime(appointment.timeSlot) }} - {{ appointment.customerName }}
                  </div>
                  <div v-if="getWindowUpcomingAppointments(window).length > 3" class="more-clients">
                    +{{ getWindowUpcomingAppointments(window).length - 3 }} more
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Queue Section -->
        <div class="queue-section">
          <div class="section-header">
            <h3>Current Queue</h3>
            <div class="filter-controls">
              <select v-model="queueFilter">
                <option value="all">All Types</option>
                <option v-for="dealType in availableDealTypes" :key="dealType" :value="dealType">
                  {{ dealType }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="filteredQueue.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <p>No clients in queue</p>
          </div>

          <div v-else class="queue-table">
            <table>
              <thead>
              <tr>
                <th>Position</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(appointment, index) in filteredQueue" :key="appointment._id">
                <td>{{ index + 1 }}</td>
                <td>{{ appointment.formattedTime || formatAppointmentTime(appointment.timeSlot) }}</td>
                <td>{{ appointment.customerName }}</td>
                <td>{{ appointment.service?.type || 'N/A' }}</td>
                <td>
                    <span class="status-indicator" :class="appointment.status">
                      {{ appointment.status }}
                    </span>
                </td>
                <td class="actions">
                  <button
                      v-if="appointment.status === 'waiting' || appointment.status === 'checked-in'"
                      class="start-btn"
                      @click="startServing(appointment._id)"
                  >
                    Start Serving
                  </button>
                  <button
                      v-if="appointment.status === 'in-progress'"
                      class="complete-btn"
                      @click="completeCurrentAppointment(appointment._id)"
                  >
                    Complete
                  </button>
                  <button
                      v-if="appointment.status !== 'no-show' && appointment.status !== 'completed'"
                      class="no-show-btn"
                      @click="markNoShow(appointment._id)"
                  >
                    No Show
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Upcoming Appointments -->
        <!-- Replace the current appointments section with this complete section that includes both header and content: -->

        <!-- Appointments Section -->
        <div class="upcoming-section">
          <div class="section-header">
            <h3>Appointments</h3>
            <div class="appointment-controls">
              <div class="date-navigation">
                <button @click="changeDate(-1)">&lt; Prev.</button>
                <div class="current-date">{{ formatDateForDisplay(selectedDate) }}</div>
                <button @click="changeDate(1)">Next &gt;</button>
              </div>
              <div class="view-toggle">
                <button
                    :class="['toggle-btn', upcomingFilter === 'upcoming' ? 'active' : '']"
                    @click="upcomingFilter = 'upcoming'"
                >
                  Upcoming
                </button>
                <button
                    :class="['toggle-btn', upcomingFilter === 'history' ? 'active' : '']"
                    @click="upcomingFilter = 'history'"
                >
                  History
                </button>
              </div>
            </div>
          </div>

          <div v-if="filteredUpcomingAppointments.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No {{ upcomingFilter === 'upcoming' ? 'upcoming' : 'history' }} appointments for this day</p>
          </div>

          <div v-else class="appointments-list">
            <div
                v-for="appointment in filteredUpcomingAppointments"
                :key="appointment._id"
                class="appointment-card"
                :class="getAppointmentWindowClass(appointment)"
            >
              <div class="time">{{ appointment.formattedTime || formatAppointmentTime(appointment.timeSlot) }}</div>
              <div class="details">
                <div class="name">{{ appointment.customerName }}</div>
                <div class="service">{{ appointment.service?.type || 'N/A' }}</div>
                <div class="assigned-window" v-if="windowAssignments && getAssignedWindowNumber(appointment)">
  <span class="window-indicator" :class="getWindowIndicatorClass(getAssignedWindowNumber(appointment))">
    Window {{ getAssignedWindowNumber(appointment) }}
  </span>
                  <span class="status-pill" :class="appointment.status">
    {{ appointment.status }}
  </span>
                </div>
                <div class="contact">
                  <span>{{ appointment.phoneNumber }}</span>
                  <span>{{ appointment.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Window Modal -->
    <div v-if="showAddWindowModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingWindow ? 'Edit Window' : 'Add New Window' }}</h2>
          <button class="close-btn" @click="cancelWindowModal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="windowNumber">Window Number</label>
            <input
                id="windowNumber"
                v-model.number="newWindow.number"
                type="number"
                min="1"
                :disabled="editingWindow"
                required
            >
          </div>

          <!-- Staff Information section with better alignment -->
          <div class="form-group" v-if="!editingWindow || (editingWindow && editingWindow.staff)">
            <label>Staff Information</label>
            <div class="staff-fields">
              <div class="form-group">
                <label for="staffFirstName">First Name</label>
                <input
                    id="staffFirstName"
                    v-model="newWindow.staff.firstName"
                    type="text"
                    placeholder="First Name"
                    required
                >
              </div>
              <div class="form-group">
                <label for="staffLastName">Last Name</label>
                <input
                    id="staffLastName"
                    v-model="newWindow.staff.lastName"
                    type="text"
                    placeholder="Last Name"
                >
              </div>
            </div>
          </div>

          <!-- Deal Types section with improved display -->
          <div class="form-group">
            <label>Deal Types</label>
            <div v-if="availableDealTypes.length === 0" class="empty-deal-types">
              No deal types available for your bank.
              <p>All deal types from your bank will appear here.</p>
            </div>
            <div v-else class="deal-type-selection">
              <div
                  v-for="dealType in availableDealTypes"
                  :key="dealType"
                  class="deal-type-checkbox"
              >
                <input
                    :id="`dt-${dealType}`"
                    type="checkbox"
                    :value="dealType"
                    v-model="newWindow.dealTypes"
                >
                <label :for="`dt-${dealType}`">{{ dealType }}</label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="cancelWindowModal">Cancel</button>
          <button class="save-btn" @click="saveWindow">
            {{ editingWindow ? 'Update Window' : 'Add Window' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Staff Modal -->
    <div v-if="showStaffModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Assign Staff to Window {{ staffWindow.number }}</h2>
          <button class="close-btn" @click="cancelStaffModal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="staffFirstName">First Name</label>
            <input
                id="staffFirstName"
                v-model="staffForm.firstName"
                type="text"
                placeholder="First Name"
                required
            >
          </div>

          <div class="form-group">
            <label for="staffLastName">Last Name</label>
            <input
                id="staffLastName"
                v-model="staffForm.lastName"
                type="text"
                placeholder="Last Name"
                required
            >
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="cancelStaffModal">Cancel</button>
          <button class="save-btn" @click="saveStaffAssignment">Assign Staff</button>
        </div>
      </div>
    </div>

    <!-- Delete Window Confirmation Modal -->
    <div v-if="showDeleteConfirmModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-btn" @click="cancelDeleteWindow">&times;</button>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to delete Window {{ windowToDelete }}?</p>
          <p>This action cannot be undone.</p>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="cancelDeleteWindow">Cancel</button>
          <button class="delete-confirm-btn" @click="deleteWindow">Delete Window</button>
        </div>
      </div>
    </div>
  </div>
</template>





<script>
import { axiosInstance } from '@/main';
import { distributeAppointments as distributeAppointmentsUtil } from '@/utils/appointmentDistributor';

export default {
  name: 'BranchDashboard',
  data() {
    return {
      branchId: '',
      branchName: '',
      bankName: '',
      bankId: '',
      stats: {
        todayTotal: 0,
        waiting: 0,
        inProgress: 0,
        served: 0,
        noShows: 0
      },
      currentQueue: [],
      upcomingAppointments: [],
      windows: [],
      showAddWindowModal: false,
      editingWindow: null,
      newWindow: {
        number: 1,
        dealTypes: [],
        status: 'inactive',
        staff: {
          firstName: '',
          lastName: ''
        }
      },
      availableDealTypes: [],
      queueFilter: 'all',
      upcomingFilter: 'upcoming',
      selectedDate: new Date(),
      refreshInterval: null,
      showDeleteConfirmModal: false,
      windowToDelete: null,
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
      showStaffModal: false,
      staffWindow: {},
      staffForm: {
        firstName: '',
        lastName: ''
      },
      windowColors: [
        'window-color-1',
        'window-color-2',
        'window-color-3',
        'window-color-4',
        'window-color-5',
        'window-color-6',
        'window-color-7',
        'window-color-8'
      ],
      windowBorderColors: [
        'window-border-1',
        'window-border-2',
        'window-border-3',
        'window-border-4',
        'window-border-5',
        'window-border-6',
        'window-border-7',
        'window-border-8'
      ],
      windowAssignments: {}
    };
  },

  watch: {
    currentQueue: {
      handler() {
        this.calculateClientSideStats();
      },
      deep: true
    },
    upcomingAppointments: {
      handler() {
        this.distributeAppointments();
      },
      deep: true
    }
  },

  computed: {
    filteredQueue() {
      if (!this.currentQueue || this.currentQueue.length === 0) {
        return [];
      }

      if (this.queueFilter === 'all') {
        return this.currentQueue;
      }

      return this.currentQueue.filter(appointment =>
          appointment.service && appointment.service.type === this.queueFilter
      );
    },

    authHeaders() {
      return {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('branchToken')}`
        }
      };
    },

    filteredUpcomingAppointments() {
      if (!this.upcomingAppointments || this.upcomingAppointments.length === 0) {
        return [];
      }

      if (this.upcomingFilter === 'upcoming') {
        // Show all appointments except completed and no-show
        return this.upcomingAppointments.filter(appointment =>
            appointment.status !== 'completed' && appointment.status !== 'no-show'
        );
      } else if (this.upcomingFilter === 'history') {
        // Show only completed and no-show appointments
        return this.upcomingAppointments.filter(appointment =>
            appointment.status === 'completed' || appointment.status === 'no-show'
        );
      }

      return this.upcomingAppointments;
    }
  },

  mounted() {
    // Debug token information
    const token = localStorage.getItem('branchToken');
    console.log('JWT Token:', token ? 'Present' : 'Missing');
    if (token) {
      try {
        // Simple decode of JWT payload (middle part)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        console.log('Token expiration:', new Date(payload.exp * 1000).toLocaleString());
        console.log('Current time:', new Date().toLocaleString());
        console.log('Token expires in:', Math.round((payload.exp * 1000 - Date.now()) / 60000), 'minutes');
      } catch (e) {
        console.error('Invalid token format');
      }
    }

    console.log('Loading dashboard data at:', new Date().toLocaleString());
    this.loadDashboardData();

    // Set up auto-refresh every 60 seconds
    this.refreshInterval = setInterval(this.refreshData, 60000);
  },

  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },

  methods: {
    async loadDashboardData() {
      // Load credentials from localStorage
      this.branchId = localStorage.getItem('branchId');
      this.branchName = localStorage.getItem('branchName');
      this.bankName = localStorage.getItem('bankName');
      this.bankId = localStorage.getItem('bankId');

      if (!this.branchId || !this.bankId) {
        this.$router.push({name: 'BranchLogin'});
        return;
      }

      // Load all data simultaneously
      Promise.all([
        this.loadDealTypes(),
        this.loadWindows(),
        this.loadStats(),
        this.loadQueueData(),
        this.loadUpcomingAppointments()
      ]).catch(error => {
        console.error('Error loading dashboard data:', error);
      });

      await this.verifyWindowStates();
    },

    async verifyWindowStates() {
      // For each window that's "serving"
      for (const window of this.windows) {
        if (window.status === 'serving' && window.currentAppointment) {
          // Try to find the corresponding appointment
          const appointment = this.currentQueue.find(a =>
              a._id === window.currentAppointment && a.status === 'in-progress'
          );
          // If appointment not found or not in-progress, reset window
          if (!appointment) {
            console.log(`Fixing inconsistent state for Window ${window.number}`);
            try {
              await axiosInstance.put(
                  `/branch/${this.branchId}/windows/${window.number}`,
                  { status: 'active', currentAppointment: null },
                  this.authHeaders
              );
            } catch (error) {
              console.error(`Failed to reset window ${window.number}:`, error);
            }
          }
        }
      }
      // Force refresh after fixing states
      await this.loadWindows();
    },

    async refreshData() {
      await Promise.all([
        this.loadQueueData(),
        this.loadUpcomingAppointments()
      ]);
      this.windows.forEach(window => {
        if (window.status === 'serving' && window.currentAppointment) {
          const currentAppointment = this.upcomingAppointments.find(a =>
              a._id === window.currentAppointment
          );
          // If appointment is not in-progress, fix the window
          if (!currentAppointment || currentAppointment.status !== 'in-progress') {
            this.resetWindowStatus(window.number);
          }
        }
      });
      this.calculateClientSideStats();
    },

    async resetWindowStatus(windowNumber) {
      try {
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${windowNumber}`,
            {
              status: 'active',
              currentAppointment: null
            },
            this.authHeaders
        );
        console.log(`Reset window ${windowNumber} due to state mismatch`);
      } catch (error) {
        console.error('Error resetting window:', error);
      }
    },

    getWindowBorderClass(window) {
      const colorIndex = (window.number - 1) % this.windowBorderColors.length;
      return this.windowBorderColors[colorIndex];
    },

    cancelStaffModal() {
      this.showStaffModal = false;
      this.staffWindow = {};
      this.staffForm.firstName = '';
      this.staffForm.lastName = '';
    },

    async saveStaffAssignment() {
      try {
        if (!this.staffForm.firstName || !this.staffForm.lastName) {
          alert('Please enter both first and last name');
          return;
        }

        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${this.staffWindow.number}`,
            {
              staff: {
                firstName: this.staffForm.firstName,
                lastName: this.staffForm.lastName
              }
            },
            this.authHeaders
        );

        // Reload windows
        await this.loadWindows();

        // Close modal
        this.cancelStaffModal();

      } catch (error) {
        console.error('Error assigning staff:', error);
        alert('Failed to assign staff. Please try again.');
      }
    },
    getWindowIndicatorClass(windowNumber) {
      const colorIndex = (windowNumber - 1) % this.windowBorderColors.length;
      return `window-indicator-${colorIndex + 1}`; // +1 to match 1-based indexing
    },

    /**
     * Modified method to get appointments for a specific window,
     * using our pre-computed distribution
     */
    getWindowUpcomingAppointments(window) {
      // Check if we have cached assignments
      if (!this.windowAssignments || Object.keys(this.windowAssignments).length === 0) {
        this.distributeAppointments();
      }

      // Get assignments and filter by status
      const appointments = this.windowAssignments[window.number] || [];
      return appointments.filter(a =>
          a.status === 'scheduled' || a.status === 'checked-in'
      );
    },

    getWindowUpcomingCount(window) {
      return this.getWindowUpcomingAppointments(window).length;
    },

    // Method to determine which window will handle an appointment
    getAssignedWindowNumber(appointment) {
      // Check cached assignments first
      for (const [windowNumber, appointments] of Object.entries(this.windowAssignments)) {
        if (appointments.some(a => a._id === appointment._id)) {
          return Number(windowNumber);
        }
      }

      // Fallback to previous logic if not found in assignments
      const matchingWindows = this.windows.filter(window =>
          (window.status === 'active' || window.status === 'serving') &&
          window.dealTypes.includes(appointment.service?.type)
      );
      return matchingWindows[0]?.number || null;
    },


    getAppointmentWindowClass(appointment) {
      const number = this.getAssignedWindowNumber(appointment);
      return `window-color-${number}`;
    },

    async loadDealTypes() {
      try {
        const response = await axiosInstance.get(`/banks/${this.bankId}/deals`);
        const deals = response.data;

        // Extract all unique deal types
        this.availableDealTypes = [];

        deals.forEach(deal => {
          deal.dealTypes.forEach(dt => {
            if (!this.availableDealTypes.includes(dt.serviceType)) {
              this.availableDealTypes.push(dt.serviceType);
            }
          });
        });
      } catch (error) {
        console.error('Error loading deal types:', error);
      }
    },

    async loadWindows() {
      try {
        const response = await axiosInstance.get(`/branch/${this.branchId}/windows`, this.authHeaders);
        console.log("Windows response:", response.data);

        // Ensure each window has a staff property
        this.windows = response.data.map(window => {
          // Preserve existing staff data if available
          return {
            ...window,
            staff: window.staff ? {
              firstName: window.staff.firstName || '',
              lastName: window.staff.lastName || ''
            } : { firstName: '', lastName: '' }
          };
        });

        this.distributeAppointments();
      } catch (error) {
        console.error('Error loading windows:', error);
        this.windows = [];
      }
    },

    async loadStats() {
      try {
        // Get server stats if available
        const response = await axiosInstance.get('/branch-dashboard', this.authHeaders);

        // Client-side fallback calculation
        const waiting = this.currentQueue.filter(a =>
            a.status === 'waiting' || a.status === 'checked-in'
        ).length;

        const inProgress = this.currentQueue.filter(a =>
            a.status === 'in-progress'
        ).length;

        const served = this.upcomingAppointments.filter(a =>
            a.status === 'completed'
        ).length;

        const noShows = this.upcomingAppointments.filter(a =>
            a.status === 'no-show'
        ).length;

        this.stats = {
          todayTotal: this.upcomingAppointments.length,
          waiting: response.data.stats.waiting || waiting,
          inProgress: response.data.stats.inProgress || inProgress,
          served: response.data.stats.served || served,
          noShows: response.data.stats.noShows || noShows
        };

      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to client-side calculation
        this.calculateClientSideStats();
      }
    },

    calculateClientSideStats() {
      this.stats = {
        todayTotal: this.upcomingAppointments.length,
        waiting: this.currentQueue.filter(a =>
            a.status === 'waiting' || a.status === 'checked-in'
        ).length,
        inProgress: this.currentQueue.filter(a =>
            a.status === 'in-progress'
        ).length,
        served: this.upcomingAppointments.filter(a =>
            a.status === 'completed'
        ).length,
        noShows: this.upcomingAppointments.filter(a =>
            a.status === 'no-show'
        ).length
      };
    },

    async loadQueueData() {
      try {
        const response = await axiosInstance.get('/branch-dashboard', this.authHeaders);
        this.currentQueue = response.data.currentQueue;
      } catch (error) {
        console.error('Error loading queue data:', error);
      }
    },

    /**
     * Called when loading appointment data to ensure proper distribution
     */
    async loadUpcomingAppointments() {
      try {
        // Clear cached assignments when loading new data
        this.windowAssignments = {};

        // Format the selected date for the API
        const formattedDate = this.formatDateForAPI(this.selectedDate);

        const response = await axiosInstance.get(
            `/branch-dashboard/appointments/${formattedDate}`,
            this.authHeaders
        );

        this.upcomingAppointments = response.data;

        // After loading appointments, distribute them among windows
        this.distributeAppointments();
      } catch (error) {
        console.error('Error loading upcoming appointments:', error);
        this.upcomingAppointments = [];
      }
    },

    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDateForDisplay(date) {
      const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
      return date.toLocaleDateString('en-US', options);
    },

    formatAppointmentTime(timeSlot) {
      if (!timeSlot) return 'N/A';

      // Handle different timeSlot formats
      try {
        // If timeSlot is a string in "DD/MM/YY/HH/MM" format
        if (typeof timeSlot === 'string' && timeSlot.includes('/')) {
          const parts = timeSlot.split('/');
          if (parts.length === 5) {
            const hour = parts[3];
            const minute = parts[4];
            return `${hour}:${minute}`;
          }
        }

        // If timeSlot is a date string
        const date = new Date(timeSlot);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        }

        // Default fallback
        return timeSlot.toString();
      } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid time';
      }
    },

    getBankLogo(bankName) {
      if (this.bankLogos[bankName]) {
        return this.bankLogos[bankName];
      }

      // Default logo if not found
      return '/logos/default-bank.png';
    },

    getAppointmentDetails(appointmentId) {
      const appointment = this.currentQueue.find(a => a._id === appointmentId);
      if (!appointment) return 'Loading...';

      return `${appointment.customerName} - ${appointment.service?.type || 'N/A'}`;
    },

    changeDate(direction) {
      const newDate = new Date(this.selectedDate);
      newDate.setDate(newDate.getDate() + direction);
      this.selectedDate = newDate;
      this.loadUpcomingAppointments();
    },

    showAddWindow() {
      // Reset form state
      this.editingWindow = null;
      this.newWindow = {
        number: this.getNextWindowNumber(),
        dealTypes: [],
        status: 'inactive',
        staff: {
          firstName: this.newWindow.staff?.firstName?.trim() || '',
          lastName: this.newWindow.staff?.lastName?.trim() || ''
        }
      };
      this.showAddWindowModal = true;

      // Reset scroll position when opening modal
      setTimeout(() => {
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
      }, 100);
    },

    confirmDeleteWindow(windowNumber) {
      this.windowToDelete = windowNumber;
      this.showDeleteConfirmModal = true;
    },

    cancelDeleteWindow() {
      this.windowToDelete = null;
      this.showDeleteConfirmModal = false;
    },

    async deleteWindow() {
      if (!this.windowToDelete) return;

      try {
        // Call the delete window API endpoint
        await axiosInstance.delete(
            `/branch/${this.branchId}/windows/${this.windowToDelete}`,
            this.authHeaders
        );
        await this.loadWindows();


        this.showDeleteConfirmModal = false;
        this.windowToDelete = null;
      } catch (error) {
        console.error('Error deleting window:', error);

        // Show appropriate error message based on the response
        if (error.response && error.response.data && error.response.data.error) {
          alert(`Failed to delete window: ${error.response.data.error}`);
        } else {
          alert('Failed to delete window. Please try again.');
        }
      }
    },

    editWindow(window) {
      this.editingWindow = window;
      this.newWindow = {
        number: window.number,
        dealTypes: [...window.dealTypes],
        status: window.status,
        staff: window.staff ? {...window.staff} : {firstName: '', lastName: ''}
      };
      this.showAddWindowModal = true;
    },

    cancelWindowModal() {
      this.showAddWindowModal = false;
      this.editingWindow = null;
    },

    getNextWindowNumber() {
      if (!this.windows || this.windows.length === 0) return 1;

      const maxNumber = Math.max(...this.windows.map(w => w.number));
      return maxNumber + 1;
    },

    async saveWindow() {
      try {
        // Create the payload object - make sure we're sending the full staff object
        const payload = {
          windowNumber: this.newWindow.number,
          dealTypes: this.newWindow.dealTypes,
          staff: {
            firstName: this.newWindow.staff.firstName || '',
            lastName: this.newWindow.staff.lastName || ''
          },
          status: this.newWindow.status
        };



        if (this.editingWindow) {
          // Update existing window
          await axiosInstance.put(
              `/branch/${this.branchId}/windows/${this.newWindow.number}`,
              payload,
              this.authHeaders
          );
        } else {
          // Add new window
          await axiosInstance.post(
              `/branch/${this.branchId}/windows`,
              payload,
              this.authHeaders
          );
        }
        console.log("Staff data being sent:", JSON.stringify(this.newWindow.staff));
        console.log("Full payload:", JSON.stringify(payload));

        // Reload windows after API call
        await this.loadWindows();
        this.distributeAppointments();
        this.$forceUpdate(); // Force Vue to update the UI

        // Close modal
        this.showAddWindowModal = false;
        this.editingWindow = null;
      } catch (error) {
        console.error('Error saving window:', error);
        // Show more detailed error information
        if (error.response) {
          console.error('API error response:', error.response.data);
          alert(`Failed to save window: ${error.response.data.message || 'Server error'}`);
        } else {
          alert('Failed to save window. Please try again.');
        }
      }
    },

    navigateToReports() {
      this.$router.push({ name: 'BranchReports' });
    },
    navigateToAppointments() {
      this.$router.push({ name: 'BranchAppointments' });
    },
    navigateToSettings() {
      this.$router.push({ name: 'BranchSettings'});
    },

    async activateWindow(windowNumber) {
      try {
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${windowNumber}`,
            {status: 'active'},
            this.authHeaders
        );

        // Reload windows
        await this.loadWindows();
      } catch (error) {
        console.error('Error activating window:', error);
      }
    },

    async deactivateWindow(windowNumber) {
      try {
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${windowNumber}`,
            {
              status: 'inactive',
              currentAppointment: null
            },
            this.authHeaders
        );

        // Reload windows
        await this.loadWindows();
      } catch (error) {
        console.error('Error deactivating window:', error);
      }
    },

    /**
     * Enhanced version of startServing that uses load balancing
     * when assigning a client to a window for immediate service
     */
    async startServing(appointmentId) {
      // Get the appointment to find its deal type
      const appointment = this.currentQueue.find(a => a._id === appointmentId);
      if (!appointment) return;

      // Find active windows that can handle this deal type
      const matchingWindows = this.windows.filter(w =>
          w.status === 'active' &&
          !w.currentAppointment &&
          w.dealTypes.includes(appointment.service?.type)
      );

      if (matchingWindows.length === 0) {
        // No matching windows, try to find any active window
        const anyActiveWindow = this.windows.find(w =>
            w.status === 'active' && !w.currentAppointment
        );

        if (!anyActiveWindow) {
          alert('No available windows. Please activate a window first.');
          return;
        }

        await this.assignAppointmentToWindow(appointment._id, anyActiveWindow.number);
        await this.loadUpcomingAppointments();
        return;
      }

      // We have multiple matching windows - select the optimal one based on queue length
      const windowsByQueueLength = matchingWindows.map(window => {
        // Count current appointments assigned to this window
        const queueCount = this.getWindowUpcomingCount(window);

        return {
          window,
          queueCount
        };
      });

      // Sort by queue length (ascending)
      windowsByQueueLength.sort((a, b) => a.queueCount - b.queueCount);

      // Use the window with the shortest queue
      const targetWindow = windowsByQueueLength[0].window;

      // Assign the appointment to the selected window
      await this.assignAppointmentToWindow(appointment._id, targetWindow.number);
    },

    /**
     * Intelligently assigns appointments to available windows
     * This function is called when distributing upcoming appointments
     */
    distributeAppointments() {
      console.log("Running distributeAppointments() with shared utility");

      // Use the shared utility function
      this.windowAssignments = distributeAppointmentsUtil(
          this.upcomingAppointments,
          this.windows
      );

      // Force a UI refresh
      this.$nextTick(() => this.$forceUpdate());

      return this.windowAssignments;
    },


    /**
     * Helper method to handle the actual assignment of an appointment to a window
     */
    async assignAppointmentToWindow(appointmentId, windowNumber) {
      try {
        // Update appointment status
        await axiosInstance.put(
            `/appointments/${appointmentId}/status`,
            {
              status: 'in-progress',
              windowNumber: windowNumber
            },
            this.authHeaders
        );

        // Assign appointment to window
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${windowNumber}`,
            {
              status: 'serving',
              currentAppointment: appointmentId
            },
            this.authHeaders
        );

        console.log(`Assigned appointment ${appointmentId} to window ${windowNumber}`);

        // Refresh data
        this.refreshData();
      } catch (error) {
        console.error('Error assigning appointment:', error);
      }
    },

    async completeAppointment(windowNumber) {
      try {
        // Find window
        const window = this.windows.find(w => w.number === windowNumber);
        if (!window || !window.currentAppointment) return;

        // Update appointment status
        await axiosInstance.put(
            `/appointments/${window.currentAppointment}/status`,
            {status: 'completed'},
            this.authHeaders
        );

        // Reset window
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${windowNumber}`,
            {
              status: 'active',
              currentAppointment: null
            },
            this.authHeaders
        );


        await Promise.all([
          this.loadStats(),       // Refresh statistics
          this.loadQueueData(),   // Refresh current queue
          this.loadWindows(),     // Refresh window states
          this.loadUpcomingAppointments() // Refresh appointments
        ]);

        // Redistribute appointments after completion
        this.distributeAppointments();

      } catch (error) {
        console.error('Error completing appointment:', error);
      }
    },

    async completeCurrentAppointment(appointmentId) {
      try {
        // Find which window has this appointment
        const window = this.windows.find(w => w.currentAppointment === appointmentId);

        if (window) {
          // Use window completion flow
          await this.completeAppointment(window.number);
        } else {
          // Direct completion if not assigned to a window
          await axiosInstance.put(
              `/appointments/${appointmentId}/status`,
              {status: 'completed'},
              this.authHeaders
          );
          this.refreshData();
        }
      } catch (error) {
        console.error('Error completing appointment:', error);
      }
    },

    async markNoShow(appointmentId) {
      try {
        // Find if appointment is assigned to a window
        const window = this.windows.find(w => w.currentAppointment === appointmentId);

        // Update appointment status
        await axiosInstance.put(
            `/appointments/${appointmentId}/status`,
            {status: 'no-show'},
            this.authHeaders
        );

        // Reset window if appointment was assigned
        if (window) {
          await axiosInstance.put(
              `/branch/${this.branchId}/windows/${window.number}`,
              {
                status: 'active',
                currentAppointment: null
              },
              this.authHeaders
          );
        }

        await Promise.all([
          this.loadStats(),
          this.loadQueueData(),
          this.loadUpcomingAppointments(),
          this.loadWindows()
        ]);

      } catch (error) {
        console.error('Error marking no-show:', error);
      }
    },

    logout() {
      // Clear localStorage
      localStorage.removeItem('branchToken');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchName');
      localStorage.removeItem('bankName');
      localStorage.removeItem('bankId');

      // Redirect to login
      this.$router.push({name: 'BranchLogin'});
    }
  }
};
</script>


<style scoped>
/* Base styles */
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f6f8fa;
  font-family: Arial, sans-serif;
}

/* Navbar */
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

.nav-actions {
  display: flex;
  align-items: center;
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

/* Dashboard Content */
.dashboard-content {
  display: flex;
  flex: 1;
}

/* Sidebar */
.sidebar {
  width: 250px;
  background-color: #1e2938;
  color: #eaeaea;
  padding: 1.5rem 0;
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

/* Main Content */
.main-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* Stats Header */
.stats-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.2rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}

.stat-card h4 {
  margin: 0 0 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #718096;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #cbd5e0;
}

.staff-info {
  margin: 8px 0 12px;
  padding: 8px;
  background-color: #f2f8f5;
  border-radius: 6px;
  font-size: 0.9rem;
}

.staff-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .staff-fields {
    grid-template-columns: 1fr; /* Stack on small screens */
  }
}

.staff-label {
  font-weight: bold;
  color: #42b983;
  margin-right: 4px;
}

.staff-name {
  font-weight: 500;
  color: #2d3748;
}

.window-upcoming-clients {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.window-upcoming-clients h5 {
  display: flex;
  justify-content: space-between;
  margin: 0 0 8px;
  color: #4a5568;
  font-size: 0.9rem;
}

.no-upcoming {
  font-size: 0.85rem;
  color: #a0aec0;
  font-style: italic;
}

.upcoming-preview {
  font-size: 0.85rem;
}

.mini-appointment {
  margin-bottom: 4px;
  padding: 4px 8px;
  background-color: rgba(66, 153, 225, 0.1);
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-clients {
  text-align: right;
  font-size: 0.8rem;
  color: #718096;
  margin-top: 4px;
}

/* Appointment color coding by window */
.appointment-card .assigned-window {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 0.85rem;
}

.window-indicator {
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.assigned-window {
  display: flex;
  justify-content: flex-start;
  gap: 0.5rem;
  margin: 8px 0;
  flex-wrap: wrap;
}

.status-pill {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  text-transform: capitalize;
}

.status-pill.waiting,
.status-pill.checked-in {
  background-color: #bee3f8;
  color: #2b6cb0;
}

.status-pill.in-progress {
  background-color: #feebc8;
  color: #c05621;
}

.status-pill.completed {
  background-color: #c6f6d5;
  color: #2f855a;
}

.status-pill.no-show {
  background-color: #fed7d7;
  color: #c53030;
}



.window-color-1 {
  border-color: #8B5CF6 !important;
}

.window-color-2 {
  border-color: #00D2F6 !important;
}

.window-color-3 {
  border-color: #FF6B35 !important;
}

.window-color-4 {
  border-color: #10B981 !important;
}

.window-color-5 {
  border-color: #DB00FF !important;
}

.window-color-6 {
  border-color: #FACC15 !important;
}

.window-color-7 {
  border-color: #2563EB !important;
}

.window-color-8 {
  border-color: #FF7F50 !important;
}


.window-border-1 {
  border-color: #8B5CF6 !important;
}

.window-border-2 {
  border-color: #00D2F6 !important;
}

.window-border-3 {
  border-color: #FF6B35 !important;
}

.window-border-4 {
  border-color: #10B981 !important;
}

.window-border-5 {
  border-color: #DB00FF !important;
}

.window-border-6 {
  border-color: #FACC15 !important;
}

.window-border-7 {
  border-color: #2563EB !important;
}

.window-border-8 {
  border-color: #FF7F50 !important;
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


.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0.25rem 0;
}

.empty-state p:first-of-type {
  font-weight: bold;
  color: #4a5568;
}

/* Section Styles */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #2d3748;
}

/* Windows Section */
.windows-section {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.add-window-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.add-window-btn:hover {
  background-color: #3aa876;
}

.windows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.window-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f8fafc;
  transition: transform 0.2s, box-shadow 0.2s;
  height: auto;
}


.window-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.window-card.active {
  border-color: #42b983;
  border-width: 2px;
}

.window-card.serving {
  border-color: #f0ad4e;
  border-width: 2px;
  background-color: #fffaf0;
}

.window-card.inactive {
  opacity: 0.7;
}

.window-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.window-header h4 {
  margin: 0;
  color: #2d3748;
}

.window-status {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
}

.window-card.active .window-status {
  background-color: #42b983;
  color: white;
}

.window-card.serving .window-status {
  background-color: #f0ad4e;
  color: white;
}

.window-card.inactive .window-status {
  background-color: #cbd5e0;
  color: #4a5568;
}

.window-content {
  margin-bottom: 1rem;
}

.delete-btn {
  background-color: #42b983;
  color: white;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
}

.delete-btn:hover {
  background-color: #c53030;
}

.delete-confirm-btn {
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.delete-confirm-btn:hover {
  background-color: #c53030;
}

.deal-types h5 {
  margin: 0 0 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;
}

.no-deal-types {
  font-size: 0.9rem;
  color: #a0aec0;
  font-style: italic;
}

.deal-types ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.deal-types li {
  background-color: #e2e8f0;
  color: #4a5568;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.window-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.window-actions button {
  flex: 1;
  min-width: calc(50% - 0.5rem);
}

.activate-btn, .deactivate-btn, .edit-btn, .complete-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  flex: 1;
}

.activate-btn {
  background-color: #42b983;
  color: white;
}

.activate-btn:hover {
  background-color: #3aa876;
}

.deactivate-btn {
  background-color: #42b983;
  color: white;
}

.deactivate-btn:hover {
  background-color: #084a2d;
}

.edit-btn {
  background-color: #42b983;
  color: white;
}

.edit-btn:hover {
  background-color: #084a2d;
}

.complete-btn {
  background-color: #f6ad55;
  color: white;
}

.complete-btn:hover {
  background-color: #ed8936;
}

.current-appointment {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.current-appointment h5 {
  margin: 0 0 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;
}

.current-appointment p {
  margin: 0.2rem 0;
  font-size: 0.9rem;
}

/* Queue Section */
.queue-section {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-controls select {
  padding: 0.4rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #4a5568;
  background-color: white;
}

.queue-table {
  margin-top: 1rem;
  overflow-x: auto;
}

.queue-table table {
  width: 100%;
  border-collapse: collapse;
}

.queue-table th, .queue-table td {
  padding: 0.8rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.queue-table th {
  font-weight: bold;
  color: #4a5568;
  background-color: #f7fafc;
}

.queue-table td {
  color: #2d3748;
}

.status-indicator {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.status-indicator.waiting {
  background-color: #bee3f8;
  color: #2b6cb0;
}

.status-indicator.checked-in {
  background-color: #bee3f8;
  color: #2b6cb0;
}

.status-indicator.in-progress {
  background-color: #feebc8;
  color: #c05621;
}

.status-indicator.completed {
  background-color: #c6f6d5;
  color: #2f855a;
}

.status-indicator.no-show {
  background-color: #fed7d7;
  color: #c53030;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.start-btn, .no-show-btn {
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.start-btn {
  background-color: #4299e1;
  color: white;
}

.start-btn:hover {
  background-color: #3182ce;
}

.no-show-btn {
  background-color: #e53e3e;
  color: white;
}

.no-show-btn:hover {
  background-color: #c53030;
}

.upcoming-section {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-navigation button {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.date-navigation button:hover {
  background-color: #197149;
}

.current-date {
  font-weight: bold;
  color: #2d3748;
}

.appointments-list {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.appointment-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.appointment-card .time {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2d3748;
  min-width: 60px;
}

.appointment-card .details {
  flex: 1;
}

.appointment-card .name {
  font-weight: bold;
  color: #2d3748;
}

.appointment-card .service {
  font-size: 0.9rem;
  color: #4a5568;
  margin-top: 0.3rem;
}

.appointment-card .contact {
  font-size: 0.8rem;
  color: #718096;
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
}

/* Modal */
.modal {
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
  overflow-y: auto; /* Enable vertical scrolling */
  padding: 20px 0; /* Add padding to ensure modal doesn't touch screen edges */
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: calc(100vh - 40px); /* Set maximum height with some padding */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: auto; /* Center the modal content */
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.modal-header h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #a0aec0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #4a5568;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto; /* Allow scrolling inside the modal body */
  flex-grow: 1; /* Allow body to grow */
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box; /* Ensure padding doesn't affect width */
}

.form-group input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

.empty-deal-types {
  font-size: 0.9rem;
  color: #a0aec0;
  margin-bottom: 1rem;
}

.deal-type-selection {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.deal-type-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.deal-type-checkbox:hover {
  background-color: #f0f5fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.deal-type-checkbox input {
  margin-right: 10px;
  width: auto; /* Override full width for checkboxes */
}

/* Responsive design for modal */
@media (max-width: 480px) {
  .modal-content {
    width: 95%;
  }

  .deal-type-selection {
    grid-template-columns: 1fr; /* Stack on very small screens */
  }
}

.deal-type-checkbox input:checked + label {
  color: #42b983;
  font-weight: 600;
}

.deal-type-checkbox label {
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
  user-select: none;
}

/* Visual feedback for checked state */
.deal-type-checkbox input:checked ~ .checkbox-bg {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
  background-color: #42b983;
  border-radius: 4px 0 0 4px;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-shrink: 0; /* Prevent footer from shrinking */
}

.cancel-btn, .save-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn {
  background-color: #e2e8f0;
  color: #4a5568;
}

.cancel-btn:hover {
  background-color: #cbd5e0;
}

.save-btn {
  background-color: #42b983;
  color: white;
}

.save-btn:hover {
  background-color: #3aa876;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    padding: 1rem 0;
  }

  .sidebar-menu li {
    padding: 0.6rem 1rem;
  }

  .branch-details {
    padding: 0 1rem 1rem;
  }
}

@media (max-width: 768px) {
  .windows-grid,
  .appointments-list {
    grid-template-columns: 1fr;
  }

  .stats-header {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .filter-controls,
  .date-navigation {
    width: 100%;
  }

  .current-date {
    flex: 1;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-header {
    grid-template-columns: 1fr;
  }

  .date-navigation {
    flex-wrap: wrap;
  }

  .modal-content {
    width: 95%;
  }
}


.appointment-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 768px) {
  .appointment-controls {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .appointment-controls .date-navigation,
  .appointment-controls .filter-controls {
    width: 100%;
  }
}

.view-toggle {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.toggle-btn {
  padding: 0.4rem 1rem;
  background-color: white;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.toggle-btn:hover {
  background-color: #f7fafc;
}

.toggle-btn.active {
  background-color: #42b983;
  color: white;
  font-weight: 500;
}

.toggle-btn:first-child {
  border-right: 1px solid #e2e8f0;
}

@media (max-width: 768px) {
  .view-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    text-align: center;
  }
}

</style>