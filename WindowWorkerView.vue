<template>
  <div class="window-worker-view">
    <!-- Header Section -->
    <div class="header">
      <div class="bank-info">
        <img :src="getBankLogo(bankName)" alt="Bank Logo" class="bank-logo">
        <div class="details">
          <h1>{{ bankName }}</h1>
          <h2>{{ branchName }} - Window {{ windowNumber }}</h2>
        </div>
      </div>

      <div class="staff-info" v-if="staffName && staffName !== 'Window Staff'">
        <div class="staff-badge">
          <span class="staff-name">{{ staffName }}</span>
        </div>
      </div>

      <div class="actions">
        <div class="notification-preference">
          <label>Notify via:</label>
          <select v-model="notificationPreference">
            <option value="both">Email & SMS</option>
            <option value="email">Email only</option>
            <option value="sms">SMS only</option>
          </select>
        </div>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>

    <!-- Main content -->
    <div class="main-content">
      <!-- Current client section -->
      <div class="section current-client-section" :class="{ 'has-client': currentAppointment }">
        <div v-if="currentAppointment" class="current-client-details">
          <div class="client-info">
            <div class="name">{{ currentAppointment.customerName }}</div>
            <div class="service">{{ currentAppointment.service?.type || 'N/A' }}</div>
            <div class="details">{{ currentAppointment.service?.description || '' }}</div>
            <div class="contact">
              <div><strong>Phone:</strong> {{ currentAppointment.phoneNumber }}</div>
              <div><strong>Email:</strong> {{ currentAppointment.email }}</div>
              <div v-if="currentAppointment.companyName"><strong>Company:</strong> {{ currentAppointment.companyName }}</div>
            </div>
          </div>
          <div class="client-actions">
            <div class="timer" v-if="timeElapsed">
              Serving for: {{ formatTime(timeElapsed) }}
            </div>
            <button @click="completeService" class="complete-btn">Complete Service</button>
            <button @click="markAsNoShow" class="no-show-btn">Mark as No-Show</button>
            <button @click="returnToWaiting" class="return-btn">Return to Waiting</button>
          </div>
        </div>
        <div v-else class="no-client">
          <div class="placeholder-icon">👥</div>
          <p>No client currently being served</p>
          <p>Call the next client from your queue</p>
        </div>
      </div>

      <!-- Upcoming clients section -->
      <div class="section upcoming-section">
        <div class="section-header">
          <h3>{{ isToday ? 'Today\'s Queue' : 'Appointments' }}</h3>
          <div class="date-control-container">
            <div class="date-navigation">
              <button @click="changeDate(-1)" class="date-nav-btn">&lt; Prev Day</button>
              <div class="current-date">{{ formatDateForDisplay(selectedDate) }}</div>
              <button @click="changeDate(1)" class="date-nav-btn">Next Day &gt;</button>
              <button @click="goToToday" class="today-btn" :disabled="isToday">Today</button>
            </div>

            <div class="filter-controls">
              <label for="statusFilter">Filter:</label>
              <select id="statusFilter" v-model="statusFilter" class="filter-select">
                <option value="waiting">Waiting</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="no-show">No Show</option>
                <option value="all">All Clients</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="filteredAppointments.length === 0" class="empty-queue">
          <div class="placeholder-icon">
            <div class="calendar-icon">
              <div class="calendar-month">{{ selectedDate.toLocaleString('en-US', { month: 'short' }).toUpperCase() }}</div>
              <div class="calendar-day">{{ selectedDate.getDate() }}</div>
            </div>
          </div>
          <p>No clients {{ isToday ? 'in your queue' : 'scheduled' }} for {{ isToday ? 'today' : formatDateForDisplay(selectedDate) }}</p>
        </div>

        <div v-else class="clients-list">
          <div v-for="appointment in filteredAppointments"
               :key="appointment._id"
               class="client-card"
               :class="appointment.status">
            <div class="time">{{ formatAppointmentTime(appointment.timeSlot) }}</div>
            <div class="client-details">
              <div class="name">{{ appointment.customerName }}</div>
              <div class="service">{{ appointment.service?.type || 'N/A' }}</div>
              <div v-if="appointment.companyName" class="company">
                Company: {{ appointment.companyName }}
              </div>
              <div class="status-badge" :class="appointment.status">
                {{ appointment.status }}
              </div>
            </div>
            <div class="actions">
              <button
                  v-if="isToday && !currentAppointment && (appointment.status === 'waiting' || appointment.status === 'checked-in')"
                  @click="startServing(appointment._id)"
                  class="serve-btn">
                Start Serving
              </button>
              <button
                  v-if="isToday && (appointment.status === 'waiting' || appointment.status === 'checked-in')"
                  @click="dismissClient(appointment._id)"
                  class="dismiss-btn">
                Dismiss
              </button>
              <div v-if="!isToday" class="future-date-notice">
                {{ formatDateDistance(appointment.timeSlot) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { axiosInstance } from '@/main';
import { getWindowAppointments } from '@/utils/appointmentDistributor';

export default {
  name: 'WindowWorkerView',
  props: {
    windowNumber: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      branchId: '',
      bankId: '',
      bankName: '',
      branchName: '',
      staffName: '',
      windowData: null,
      currentAppointment: null,
      appointments: [],
      statusFilter: 'waiting',
      timeElapsed: 0,
      timerInterval: null,
      serviceStartTime: null,
      selectedDate: new Date(),
      notificationPreference: 'both', // 'email', 'sms', or 'both'
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
      }
    };
  },
  computed: {
    authHeaders() {
      return {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('branchToken')}`
        }
      };
    },
    filteredAppointments() {
      let result = [];

      if (this.statusFilter === 'all') {
        result = [...this.appointments];

        if (this.currentAppointment && this.currentAppointment._id) {
          const alreadyIncluded = result.some(app => app._id === this.currentAppointment._id);
          if (!alreadyIncluded) {
            result.unshift({...this.currentAppointment, status: 'in-progress'});
          }
        }
      } else {
        result = this.appointments.filter(appointment => appointment.status === this.statusFilter);
      }

      return result;
    },
    isToday() {
      const today = new Date();
      return this.selectedDate.toDateString() === today.toDateString();
    }
  },
  mounted() {
    // Loads data from localStorage
    this.branchId = localStorage.getItem('branchId');
    this.bankId = localStorage.getItem('bankId');
    this.bankName = localStorage.getItem('bankName');
    this.branchName = localStorage.getItem('branchName');

    this.staffName = localStorage.getItem('staffName') || 'Window Staff';

    const role = localStorage.getItem('role');
    const assignedWindow = localStorage.getItem('windowNumber');

    if (role === 'window_staff' && assignedWindow !== this.windowNumber.toString()) {
      console.error('Unauthorized window access attempt');
      this.$router.push({ name: 'BranchLogin' });
      return;
    }

    if (!this.branchId || !this.bankId) {
      this.$router.push({ name: 'BranchLogin' });
      return;
    }

    this.loadWindow();
    this.refreshInterval = setInterval(() => {
      this.loadWindow();
      this.loadAppointments();
    }, 30000);
  },

  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  },
  methods: {
    async loadWindow() {
      try {
        const response = await axiosInstance.get(
            `/branch/${this.branchId}/windows/${this.windowNumber}`,
            this.authHeaders
        );
        console.log('Window data:', response.data);

        this.windowData = response.data;

        this.staffName = this.windowData.staff ?
            `${this.windowData.staff.firstName} ${this.windowData.staff.lastName}`.trim() :
            'Unassigned Staff';

        if (this.windowData.currentAppointment) {
          if (!this.currentAppointment || this.currentAppointment._id !== this.windowData.currentAppointment) {
            this.loadCurrentAppointment(this.windowData.currentAppointment);
          }
        } else {
          this.currentAppointment = null;
          this.stopTimer();
        }

        this.loadAppointments();
      } catch (error) {
        console.error('Error details:', {
          branchId: this.branchId,
          windowNumber: this.windowNumber,
          errorResponse: error.response?.data
        });
        if (error.response && error.response.status === 401) {
          this.logout();
        }
      }
    },

    async loadCurrentAppointment(appointmentId) {
      try {
        const response = await axiosInstance.get(
            `/appointments/${appointmentId}`,
            this.authHeaders
        );

        this.currentAppointment = response.data;
        this.startTimer();
      } catch (error) {
        console.error('Error loading current appointment:', error);
      }
    },

    async loadAppointments() {
      try {
        const formattedDate = this.formatDateForAPI(this.selectedDate);
        console.log('Loading appointments for date:', formattedDate);
        const response = await axiosInstance.get(
            `/branch-dashboard/appointments/${formattedDate}`,
            this.authHeaders
        );
        const windowsResponse = await axiosInstance.get(
            `/branch/${this.branchId}/windows`,
            this.authHeaders
        );

        const allWindows = windowsResponse.data;
        const allAppointments = response.data;
        const myWindowNumber = parseInt(this.windowNumber);
        const assignedAppointments = getWindowAppointments(
            allAppointments,
            allWindows,
            myWindowNumber
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

        assignedAppointments.forEach(appointment => {
          if (appointment.status === 'checked-in') {
            appointment.status = 'waiting';
          }
        });
        this.appointments = assignedAppointments.filter(appointment =>
            appointment._id !== (this.currentAppointment?._id)
        );
        console.log('Appointments for this window:', this.appointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    },

    startTimer() {
      this.serviceStartTime = new Date();
      this.timeElapsed = 0;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
      this.timerInterval = setInterval(() => {
        const now = new Date();
        this.timeElapsed = Math.floor((now - this.serviceStartTime) / 1000);
      }, 1000);
    },

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.serviceStartTime = null;
      this.timeElapsed = 0;
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDateForDisplay(date) {
      const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    },

    formatDateDistance(timeSlot) {
      try {
        let appointmentDate;
        if (typeof timeSlot === 'string' && timeSlot.includes('/')) {
          const parts = timeSlot.split('/');
          if (parts.length === 5) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = 2000 + parseInt(parts[2]);
            const hour = parseInt(parts[3]);
            const minute = parseInt(parts[4]);
            appointmentDate = new Date(year, month, day, hour, minute);
          }
        } else {
          appointmentDate = new Date(timeSlot);
        }
        if (!appointmentDate || isNaN(appointmentDate.getTime())) {
          return "Date unknown";
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDay = new Date(this.selectedDate);
        selectedDay.setHours(0, 0, 0, 0);
        const appointmentDay = new Date(appointmentDate);
        appointmentDay.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today - appointmentDay);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (today.getTime() === appointmentDay.getTime()) {
          return "Today";
        } else if (diffDays === 1) {
          return today > appointmentDay ? "Yesterday" : "Tomorrow";
        } else {
          return `In ${diffDays} days`;
        }
      } catch (error) {
        console.error('Error formatting date distance:', error);
        return "Date unknown";
      }
    },

    changeDate(direction) {
      const newDate = new Date(this.selectedDate);
      newDate.setDate(newDate.getDate() + direction);
      this.selectedDate = newDate;
      this.loadAppointments();
    },

    goToToday() {
      this.selectedDate = new Date();
      this.loadAppointments();
    },

    formatAppointmentTime(timeSlot) {
      if (!timeSlot) return 'N/A';
      try {
        if (typeof timeSlot === 'string' && timeSlot.includes('/')) {
          const parts = timeSlot.split('/');
          if (parts.length === 5) {
            const hour = parts[3];
            const minute = parts[4];
            return `${hour}:${minute}`;
          }
        }
        const date = new Date(timeSlot);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        }

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
      return '/logos/default-bank.png';
    },

    async startServing(appointmentId) {
      if (this.currentAppointment) {
        alert('Please complete the current service before starting a new one.');
        return;
      }

      try {
        await axiosInstance.put(
            `/appointments/${appointmentId}/status`,
            { status: 'in-progress' },
            this.authHeaders
        );
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${this.windowNumber}`,
            {
              status: 'serving',
              currentAppointment: appointmentId
            },
            this.authHeaders
        );
        await this.notifyClient(appointmentId);
        this.loadWindow();
      } catch (error) {
        console.error('Error starting service:', error);
        alert('Failed to start serving. Please try again.');
      }
    },


    async notifyClient(appointmentId) {
      try {
        await axiosInstance.post(
            `/appointments/${appointmentId}/notify`,
            {
              message: `Please proceed to Window ${this.windowNumber} for your service.`,
              windowNumber: this.windowNumber,
              notificationType: this.notificationPreference
            },
            this.authHeaders
        );

        console.log(`Client notification sent via ${this.notificationPreference}`);
      } catch (error) {
        console.error('Error notifying client:', error);
      }
    },

    async dismissClient(appointmentId) {
      try {
        await axiosInstance.put(
            `/appointments/${appointmentId}/status`,
            { status: 'no-show' },
            this.authHeaders
        );
        this.loadAppointments();
      } catch (error) {
        console.error('Error dismissing client:', error);
        alert('Failed to dismiss client. Please try again.');
      }
    },

    async markAsNoShow() {
      if (!this.currentAppointment) return;

      try {
        if (!confirm('Are you sure you want to mark this client as no-show?')) {
          return;
        }
        await axiosInstance.put(
            `/appointments/${this.currentAppointment._id}/status`,
            { status: 'no-show' },
            this.authHeaders
        );
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${this.windowNumber}`,
            {
              status: 'active',
              currentAppointment: null
            },
            this.authHeaders
        );
        this.stopTimer();
        this.loadWindow();
      } catch (error) {
        console.error('Error marking as no-show:', error);
        alert('Failed to mark as no-show. Please try again.');
      }
    },

    async returnToWaiting() {
      if (!this.currentAppointment) return;

      try {
        if (!confirm('Return this client to waiting status?')) {
          return;
        }
        await axiosInstance.put(
            `/appointments/${this.currentAppointment._id}/status`,
            { status: 'waiting' },
            this.authHeaders
        );
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${this.windowNumber}`,
            {
              status: 'active',
              currentAppointment: null
            },
            this.authHeaders
        );
        this.stopTimer();
        this.loadWindow();
      } catch (error) {
        console.error('Error returning to waiting status:', error);
        alert('Failed to update status. Please try again.');
      }
    },

    async completeService() {
      if (!this.currentAppointment) return;
      try {
        const serviceDuration = Math.round(this.timeElapsed / 60);

        await axiosInstance.put(
            `/appointments/${this.currentAppointment._id}/status`,
            {
              status: 'completed',
              serviceDuration,
              windowNumber: parseInt(this.windowNumber)
            },
            this.authHeaders
        );
        await axiosInstance.put(
            `/branch/${this.branchId}/windows/${this.windowNumber}`,
            {
              status: 'active',
              currentAppointment: null
            },
            this.authHeaders
        );

        this.stopTimer();
        this.loadWindow();
      } catch (error) {
        console.error('Error completing service:', error);
        alert('Failed to complete service. Please try again.');
      }
    },

    logout() {
      localStorage.removeItem('branchToken');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchName');
      localStorage.removeItem('bankName');
      localStorage.removeItem('bankId');
      localStorage.removeItem('role');
      localStorage.removeItem('windowNumber');
      localStorage.removeItem('staffName');

      this.$router.push({ name: 'BranchLogin' });
    }
  }
};
</script>

<style scoped>
.window-worker-view {
  min-height: 100vh;
  background-color: #f6f8fa;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #42b983;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.bank-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.staff-info {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.staff-badge {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.staff-name {
  font-weight: bold;
}

.bank-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: #42b983;
  border-radius: 8px;
  padding: 4px;
}

.details h1 {
  margin: 0;
  font-size: 1.2rem;
}

.details h2 {
  margin: 0.2rem 0 0;
  font-size: 1rem;
  font-weight: normal;
  opacity: 0.9;
}

.staff-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.staff-name {
  font-weight: bold;
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

.main-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section h3 {
  margin-top: 0;
  color: #2d3748;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.current-client-section {
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.current-client-section.has-client {
  border-left: 4px solid #42b983;
}

.current-client-details {
  display: flex;
  justify-content: space-between;
  gap: 2rem;
}

.client-info {
  flex: 1;
}

.client-info .name {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.client-info .service {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
}

.client-info .details {
  color: #718096;
  margin-bottom: 1rem;
}

.client-info .contact {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: #f8fafc;
  padding: 0.8rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.client-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.today-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(66, 185, 131, 0.2);
  min-width: 80px;
}

.today-btn:hover {
  background-color: #3aa876;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(66, 185, 131, 0.3);
}

.today-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4a5568;
  background-color: #f7fafc;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-align: center;
}

.no-client {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  text-align: center;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-client p {
  margin: 0.25rem 0;
}

.complete-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.complete-btn:hover {
  background-color: #874b1a;
}

.no-show-btn {
  background-color: #a0aec0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.no-show-btn:hover {
  background-color: #971c1c;
}

.return-btn {
  background-color: #a0aec0;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.return-btn:hover {
  background-color: #4e79a1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
  min-width: 300px;
}

.date-nav-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.date-nav-btn:hover {
  background-color: #3aa876;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
  justify-content: flex-end;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #4a5568;
  background-color: white;
  min-width: 150px;
}

.current-date {
  font-weight: bold;
  color: #2d3748;
  font-size: 0.95rem;
  min-width: 180px;
  text-align: center;
}

.filter-controls select {
  padding: 0.4rem 0.8rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #4a5568;
  background-color: white;
}

.empty-queue {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  text-align: center;
  padding: 2rem;
}

.clients-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.client-card {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  background-color: white;
}

.client-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.client-card.waiting,
.client-card.checked-in {
  border-left: 4px solid #48bb78;
}

.client-card.in-progress {
  border-left: 4px solid #4299e1;
}

.client-card.completed {
  border-left: 4px solid #a0aec0;
}

.client-card.no-show {
  border-left: 4px solid #F56565;
}

.client-card .time {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2d3748;
  min-width: 60px;
}

.client-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.client-details .name {
  font-weight: bold;
  color: #2d3748;
}

.client-details .service {
  color: #4a5568;
}

.client-details .company {
  font-size: 0.9rem;
  color: #718096;
}

.status-badge {
  align-self: flex-start;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
  font-weight: 500;
}

.status-badge.waiting,
.status-badge.checked-in {
  background-color: #C6F6D5;
  color: #22543D;
}

.status-badge.in-progress {
  background-color: #BEE3F8;
  color: #2A4365;
}

.status-badge.completed {
  background-color: #E2E8F0;
  color: #1A202C;
}

.status-badge.no-show {
  background-color: #FED7D7;
  color: #822727;
}

.actions {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
}

.serve-btn, .dismiss-btn {
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.serve-btn {
  background-color: #42b983;
  color: white;
  box-shadow: 0 2px 4px rgba(25, 113, 73, 0.2);
}

.serve-btn:hover {
  background-color: #3aa876;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(25, 113, 73, 0.3);
}

.dismiss-btn {
  background-color: #CBD5E0;
  color: #4A5568;
  margin-left: 8px;
}

.dismiss-btn:hover {
  background-color: #E53E3E;
  color: white;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    text-align: center;
  }

  .bank-info {
    flex-direction: column;
  }

  .staff-info {
    position: static;
    transform: none;
    margin: 0.5rem 0;
  }

  .staff-badge {
    justify-content: center;
  }

  .actions {
    justify-content: center;
  }

  .current-client-details {
    flex-direction: column;
  }

  .main-content {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .date-navigation {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .client-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .client-card .time {
    min-width: auto;
  }

  .actions {
    width: 100%;
    flex-direction: row;
    margin-top: 0.5rem;
  }

  .serve-btn, .dismiss-btn {
    flex: 1;
  }
}

.date-control-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .date-control-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
  }

  .date-navigation {
    justify-content: space-between;
  }

  .filter-controls {
    justify-content: flex-start;
  }
}

.notification-preference {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
}

.notification-preference label {
  color: white;
  font-size: 0.9rem;
}

.notification-preference select {
  padding: 0.3rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
}

.notification-preference select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .notification-preference {
    margin-right: 0;
  }
}

</style>