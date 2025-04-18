<template>
  <div class="manage-appointment-container">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading appointment details...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Error</h2>
      <p>{{ error }}</p>
      <button @click="goToHome" class="primary-button">Return to Home</button>
    </div>

    <div v-else-if="!appointment" class="not-found-container">
      <h2>Appointment Not Found</h2>
      <p>The appointment you're looking for doesn't exist or has been cancelled.</p>
      <button @click="goToHome" class="primary-button">Return to Home</button>
    </div>

    <div v-else class="appointment-details-container">
      <!-- Authentication Section -->
      <div v-if="!isAuthenticated" class="auth-section">
        <h2>Verify Appointment</h2>
        <p>Please enter your activation code to manage this appointment.</p>

        <div class="input-group">
          <label for="activation-code">Activation Code</label>
          <input
              id="activation-code"
              v-model="activationCode"
              type="text"
              placeholder="Enter your 4-digit code"
              maxlength="4"
              @keyup.enter="verifyActivationCode"
          />
        </div>

        <button @click="verifyActivationCode" class="primary-button" :disabled="verifying">
          {{ verifying ? 'Verifying...' : 'Verify' }}
        </button>

        <p v-if="authError" class="error-message">{{ authError }}</p>
      </div>

      <!-- Appointment Management Section -->
      <div v-else class="appointment-details">
        <div class="bank-info">
          <h1 class="page-title">Manage Your Appointment</h1>
          <div class="bank-header">
            <div class="bank-logo-container" v-if="bankLogo">
              <img :src="bankLogo" alt="Bank Logo" class="bank-logo">
            </div>
            <div class="bank-name-container">
              <h3 class="bank-name">{{ bankName }} - {{ branchName }}</h3>
              <p>{{ branchAddress }}</p>
            </div>
          </div>
        </div>

        <div class="appointment-card">
          <h2>Appointment Details</h2>

          <div class="info-container">
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">{{ formattedDate }}</span>
            </div>

            <div class="info-row">
              <span class="label">Time:</span>
              <span class="value">{{ formattedTime }}</span>
            </div>

            <div class="info-row">
              <span class="label">Client Type:</span>
              <span class="value">{{ appointment.entityType }}</span>
            </div>

            <div class="info-row">
              <span class="label">Service:</span>
              <span class="value">{{ appointment.service?.description || appointment.service?.type }}</span>
            </div>
          </div>
        </div>

        <div class="personal-info-card">
          <h2>Personal Information</h2>

          <div class="info-container">
            <div v-if="appointment.companyName" class="info-row">
              <span class="label">Company:</span>
              <span class="value">{{ appointment.companyName }}</span>
            </div>

            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">{{ appointment.customerName }}</span>
            </div>

            <div class="info-row">
              <span class="label">Phone:</span>
              <span class="value">{{ appointment.phoneNumber }}</span>
            </div>

            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">{{ appointment.email }}</span>
            </div>
          </div>
        </div>

        <div class="actions-container">
          <div v-if="isPastAppointment" class="past-appointment-message">
            <p>This appointment has already passed.</p>
          </div>
          <div v-else-if="tooLateToModify" class="past-appointment-message">
            <p>It's too late to modify this appointment. Please contact the bank directly.</p>
          </div>
          <div v-else class="action-buttons">
            <button
                @click="showLateness = true"
                class="secondary-button"
                :disabled="actionInProgress"
            >
              I'll Be Late
            </button>

            <button
                @click="showCancelConfirm = true"
                class="danger-button"
                :disabled="actionInProgress"
            >
              Cancel Appointment
            </button>
          </div>
        </div>

        <!-- Late Notification Modal -->
        <div v-if="showLateness" class="modal">
          <div class="modal-content">
            <h3>Inform About Delay</h3>
            <p>How many minutes will you be late?</p>

            <div class="delay-options">
              <button
                  v-for="minutes in [5, 10, 15, 20, 30]"
                  :key="minutes"
                  @click="delayMinutes = minutes"
                  :class="['delay-option', delayMinutes === minutes ? 'selected' : '']"
              >
                {{ minutes }} minutes
              </button>
            </div>

            <div class="modal-actions">
              <button @click="showLateness = false" class="secondary-button">Cancel</button>
              <button @click="notifyLateness" class="primary-button" :disabled="actionInProgress || !delayMinutes">
                {{ actionInProgress ? 'Updating...' : 'Notify' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Cancel Confirmation Modal -->
        <div v-if="showCancelConfirm" class="modal">
          <div class="modal-content">
            <h3>Cancel Appointment</h3>
            <p>Are you sure you want to cancel your appointment at {{ bankName }}?</p>
            <p class="warning">This action cannot be undone.</p>

            <div class="modal-actions">
              <button @click="showCancelConfirm = false" class="secondary-button">No, Keep It</button>
              <button @click="cancelAppointment" class="danger-button" :disabled="actionInProgress">
                {{ actionInProgress ? 'Cancelling...' : 'Yes, Cancel It' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Success Modal -->
        <div v-if="showSuccessMessage" class="modal">
          <div class="modal-content success">
            <h3>{{ successTitle }}</h3>
            <p>{{ successMessage }}</p>

            <div class="modal-actions">
              <button @click="handleSuccessDismiss" class="primary-button">Ok</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ManageAppointmentPage',
  data() {
    return {
      loading: true,
      error: null,
      appointment: null,
      bankName: '',
      branchName: '',
      branchAddress: '',
      bankLogo: null,

      // Authentication
      isAuthenticated: false,
      activationCode: '',
      authError: null,
      verifying: false,

      // Action states
      showLateness: false,
      showCancelConfirm: false,
      showSuccessMessage: false,
      actionInProgress: false,
      delayMinutes: null,
      isPastAppointment: false,
      tooLateToModify: false,

      // Success message
      successTitle: '',
      successMessage: ''
    };
  },
  computed: {
    appointmentId() {
      return this.$route.params.appointmentId;
    },
    formattedDate() {
      if (!this.appointment || !this.appointment.timeSlot) return '';

      const parts = this.appointment.timeSlot.split('/');
      if (parts.length < 3) return '';

      const day = parts[0];
      const month = parts[1];
      const year = `20${parts[2]}`; // Assuming YY format

      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    formattedTime() {
      if (!this.appointment || !this.appointment.timeSlot) return '';

      const parts = this.appointment.timeSlot.split('/');
      if (parts.length < 5) return '';

      const hours = parts[3].padStart(2, '0');
      const minutes = parts[4].padStart(2, '0');

      return `${hours}:${minutes}`;
    },
    appointmentDateTime() {
      if (!this.appointment || !this.appointment.timeSlot) return null;

      const parts = this.appointment.timeSlot.split('/');
      if (parts.length < 5) return null;

      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
      const year = 2000 + parseInt(parts[2]); // Assuming YY format (20YY)
      const hours = parseInt(parts[3]);
      const minutes = parseInt(parts[4]);

      return new Date(year, month, day, hours, minutes);
    }
  },
  async created() {
    try {
      // First, try to load the appointment details
      await this.fetchAppointmentDetails();

      // Check if appointment is in the past or too late to modify
      this.checkAppointmentTime();
    } catch (error) {
      console.error('Error in created lifecycle hook:', error);
      this.error = 'Failed to load appointment details. Please try again later.';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async fetchAppointmentDetails() {
      try {
        // In a real app, you would make an API call to get the appointment details
        // For now, we'll simulate this with a backend call
        const response = await axios.get(`http://localhost:5000/api/appointments/${this.appointmentId}`);

        if (response.data) {
          this.appointment = response.data;

          // Now fetch bank and branch details
          await this.fetchBankAndBranchDetails();
        }
      } catch (error) {
        console.error('Error fetching appointment:', error);
        if (error.response && error.response.status === 404) {
          this.appointment = null; // Appointment not found
        } else {
          throw error; // Re-throw for the created hook to catch
        }
      }
    },

    async fetchBankAndBranchDetails() {
      try {
        if (!this.appointment || !this.appointment.bank || !this.appointment.branch) {
          throw new Error('Missing bank or branch information');
        }

        const response = await axios.get(
            `http://localhost:5000/api/banks/${this.appointment.bank}/branches/${this.appointment.branch}`
        );

        if (response.data) {
          this.bankName = response.data.bankName;
          this.branchName = response.data.branchName;
          this.branchAddress = response.data.branchAddress;

          // Try to load bank logo
          this.fetchBankLogo(this.bankName);
        }
      } catch (error) {
        console.error('Error fetching bank/branch details:', error);
        this.bankName = 'Unknown Bank';
        this.branchName = 'Unknown Branch';
      }
    },

    fetchBankLogo(bankName) {
      // Map bank names to their logo files (similar to backend logic)
      const logoMapping = {
        'Acba Bank': 'acba.png',
        'Ameriabank': 'ameriabank.png',
        'AMIO bank': 'amio.png',
        'Araratbank': 'araratbank.png',
        'Ardshinbank': 'ardshinbank.png',
        'Ardshininvestbank': 'ardshinbank.png',
        'Armeconombank': 'armeconombank.jpg',
        'Artsakhbank': 'artsakhbank.png',
        'Byblos Bank Armenia': 'byblos.webp',
        'Converse Bank': 'converse.jpg',
        'Evocabank': 'evocabank.png',
        'Fast Bank': 'fast.jpeg',
        'ID Bank': 'idbank.png',
        'Idram': 'idram.png',
        'Inecobank': 'inecobank.png',
        'VTB Bank (Armenia)': 'vtb.png'
      };

      const logoFile = logoMapping[bankName] || 'default-bank.png';
      this.bankLogo = `http://localhost:5000/logos/${logoFile}`;
    },

    checkAppointmentTime() {
      if (!this.appointmentDateTime) return;

      const now = new Date();

      // Check if appointment is in the past
      if (this.appointmentDateTime < now) {
        this.isPastAppointment = true;
        return;
      }

      // Check if it's too late to modify (more than 60 minutes late)
      const minutesDifference = (now - this.appointmentDateTime) / (1000 * 60);
      if (minutesDifference > 60) {
        this.tooLateToModify = true;
      }
    },

    async verifyActivationCode() {
      if (!this.activationCode || this.activationCode.length !== 4) {
        this.authError = 'Please enter a valid 4-digit activation code.';
        return;
      }

      this.verifying = true;
      this.authError = null;

      try {
        // In a real implementation, you would verify the code with the server
        // For simplicity in this example, we'll compare with the appointment password
        if (this.appointment.password === this.activationCode) {
          this.isAuthenticated = true;
        } else {
          this.authError = 'Invalid activation code. Please try again.';
        }
      } catch (error) {
        console.error('Error verifying code:', error);
        this.authError = 'Verification failed. Please try again.';
      } finally {
        this.verifying = false;
      }
    },

    async notifyLateness() {
      if (!this.delayMinutes) return;

      this.actionInProgress = true;

      try {
        // Calculate the new time (delayed by delayMinutes)
        const timeSlotParts = this.appointment.timeSlot.split('/');

        // Extract time components
        const day = timeSlotParts[0];
        const month = timeSlotParts[1];
        const year = timeSlotParts[2];
        let hours = parseInt(timeSlotParts[3]);
        let minutes = parseInt(timeSlotParts[4]);

        // Add delay minutes
        minutes += this.delayMinutes;

        // Handle minute overflow
        if (minutes >= 60) {
          hours += Math.floor(minutes / 60);
          minutes = minutes % 60;
        }

        // Handle hour overflow (if the delay pushes to next day)
        if (hours >= 24) {
          // This is simplified - in a real app you would need to handle date changes
          hours = hours % 24;
        }

        // Format new time
        const newTimeSlot = `${day}/${month}/${year}/${String(hours).padStart(2, '0')}/${String(minutes).padStart(2, '0')}`;

        // Make API call to update the appointment
        await axios.put(
            `http://localhost:5000/api/appointments/${this.appointmentId}/delay`,
            {
              newTimeSlot,
              delayMinutes: this.delayMinutes
            },
            {
              headers: {
                'Authorization': `Bearer ${this.activationCode}`
              }
            }
        );

        // Update local state
        this.appointment.timeSlot = newTimeSlot;

        // Hide the lateness modal
        this.showLateness = false;
        this.delayMinutes = null;

        // If delay is 5 minutes, redirect to home page immediately
        if (this.delayMinutes === 5) {
          this.$router.push('/');
          return;
        }

        // Otherwise show success message
        this.successTitle = 'Delay Notified';
        this.successMessage = `Your appointment has been rescheduled for ${this.formattedTime}. Thank you for letting us know!`;
        this.showSuccessMessage = true;
      } catch (error) {
        console.error('Error updating appointment time:', error);
        alert('Failed to update your appointment time. Please try again or contact customer service.');
      } finally {
        this.actionInProgress = false;
      }
    },

    async cancelAppointment() {
      this.actionInProgress = true;

      try {
        // Make API call to cancel the appointment
        await axios.delete(`http://localhost:5000/api/appointments/${this.appointmentId}`, {
          headers: {
            'Authorization': `Bearer ${this.activationCode}`
          }
        });

        // Show success message
        this.successTitle = 'Appointment Cancelled';
        this.successMessage = 'Your appointment has been successfully cancelled.';
        this.showSuccessMessage = true;

        // Hide the confirmation modal
        this.showCancelConfirm = false;
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel your appointment. Please try again or contact customer service.');
        this.showCancelConfirm = false;
      } finally {
        this.actionInProgress = false;
      }
    },

    handleSuccessDismiss() {
      this.showSuccessMessage = false;

      // Redirect to home for both appointment cancellation and delay notification
      if (this.successTitle === 'Appointment Cancelled' || this.successTitle === 'Delay Notified') {
        this.goToHome();
      }
    },

    goToHome() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.manage-appointment-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: Arial, sans-serif;
}

.loading-container, .error-container, .not-found-container {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4CAF50;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.auth-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
}

.error-message {
  color: #dc3545;
  margin-top: 1rem;
}

.bank-info {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  color: #4CAF50;
  margin-bottom: 1rem;
  font-weight: 600;
}

.bank-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.bank-logo-container {
  width: 60px;
  height: 60px;
  overflow: hidden;
}

.bank-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.bank-name-container {
  text-align: left;
}

.bank-name {
  color: #2c3e50;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.appointment-card, .personal-info-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 0 auto 1.5rem;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.appointment-card h2, .personal-info-card h2 {
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
  text-align: center;
}

.info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-row {
  display: flex;
  margin-bottom: 0.75rem;
  width: 100%;
  max-width: 400px;
}

.label {
  font-weight: bold;
  min-width: 120px;
  color: #555;
}

.value {
  color: #333;
}

.past-appointment-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  text-align: center;
}

.actions-container {
  margin-top: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.primary-button, .secondary-button, .danger-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.primary-button {
  background-color: #4CAF50;
  color: white;
  flex: 1;
}

.primary-button:hover {
  background-color: #45a049;
}

.secondary-button {
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #ced4da;
  flex: 1;
}

.secondary-button:hover {
  background-color: #e9ecef;
}

.danger-button {
  background-color: #dc3545;
  color: white;
  flex: 1;
}

.danger-button:hover {
  background-color: #c82333;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.modal-content p {
  margin-bottom: 1.5rem;
}

.modal-content.success {
  border-top: 4px solid #4CAF50;
}

.warning {
  color: #dc3545;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.delay-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.delay-option {
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.delay-option:hover {
  background-color: #e9ecef;
}

.delay-option.selected {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

@media (max-width: 600px) {
  .action-buttons {
    flex-direction: column;
  }

  .info-row {
    flex-direction: column;
  }

  .label {
    margin-bottom: 0.25rem;
  }
}
</style>