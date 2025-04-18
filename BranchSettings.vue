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
          <li @click="navigateToDashboard"><span class="icon">📊</span>Dashboard</li>
          <li @click="navigateToAppointments"><span class="icon">🗓️</span>Appointments</li>
          <li @click="navigateToReports"><span class="icon">📈</span>Reports</li>
          <li class="active"><span class="icon">⚙️</span>Settings</li>
        </ul>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="settings-container">
          <div class="section-header">
            <h3>Branch Settings</h3>
          </div>

          <!-- Branch Information Card -->
          <div class="settings-card">
            <div class="card-header">
              <h4>Branch Information</h4>
            </div>
            <div class="branch-info-details">
              <div class="info-item">
                <div class="info-label">Branch Name</div>
                <div class="info-value">{{ branchName }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Branch ID</div>
                <div class="info-value">{{ branchId }}</div>
              </div>
            </div>
          </div>

          <!-- Settings Options -->
          <div class="settings-options">
            <div class="settings-option-card" @click="togglePasswordSettings">
              <div class="option-icon">🏦</div>
              <div class="option-content">
                <h4>Branch Password Settings</h4>
                <p>Change your branch access code</p>
              </div>
              <div class="option-arrow">
                <i v-if="showPasswordSettings">▲</i>
                <i v-else>▼</i>
              </div>
            </div>

            <!-- Window Password Settings Option -->
            <div class="settings-option-card" @click="toggleWindowPasswordSettings">
              <div class="option-icon">🛂</div>
              <div class="option-content">
                <h4>Window Password Settings</h4>
                <p>Change access codes for branch windows</p>
              </div>
              <div class="option-arrow">
                <i v-if="showWindowPasswordSettings">▲</i>
                <i v-else>▼</i>
              </div>
            </div>

            <!-- Check-in Password Settings Option -->
            <div class="settings-option-card" @click="toggleCheckinPasswordSettings">
              <div class="option-icon">📇</div>
              <div class="option-content">
                <h4>Check-in Password Settings</h4>
                <p>Change check-in access code for branch</p>
              </div>
              <div class="option-arrow">
                <i v-if="showCheckinPasswordSettings">▲</i>
                <i v-else>▼</i>
              </div>
            </div>
          </div>

          <!-- Branch Password Settings (Expandable) -->
          <div v-if="showPasswordSettings" class="settings-card password-settings-section">
            <div class="card-header">
              <h4>Change Branch Access Code</h4>
            </div>
            <div class="card-content">
              <form @submit.prevent="changePassword" class="settings-form">
                <!-- Current Password -->
                <div class="form-group">
                  <label for="current-password">Current Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="current-password"
                        v-model="currentPassword"
                        :type="showCurrentPassword ? 'text' : 'password'"
                        placeholder="Enter your current access code"
                        required
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleCurrentPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showCurrentPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                </div>

                <!-- New Password -->
                <div class="form-group">
                  <label for="new-password">New Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="new-password"
                        v-model="newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        placeholder="Enter your new access code"
                        required
                        @input="validateNewPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleNewPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showNewPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                  <div v-if="newPasswordError" class="input-error">
                    {{ newPasswordError }}
                  </div>
                </div>

                <!-- Confirm New Password -->
                <div class="form-group">
                  <label for="confirm-password">Confirm New Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="confirm-password"
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        placeholder="Confirm your new access code"
                        required
                        @input="validateConfirmPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleConfirmPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showConfirmPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                  <div v-if="confirmPasswordError" class="input-error">
                    {{ confirmPasswordError }}
                  </div>
                </div>

                <!-- Password Requirements -->
                <div class="password-requirements">
                  <h5>Password Requirements:</h5>
                  <ul>
                    <li :class="{ met: passwordLength }">At least 8 characters long</li>
                    <li :class="{ met: passwordHasUppercase }">At least one uppercase letter</li>
                    <li :class="{ met: passwordHasLowercase }">At least one lowercase letter</li>
                    <li :class="{ met: passwordHasNumber }">At least one number</li>
                  </ul>
                </div>

                <!-- Status Messages -->
                <div v-if="errorMessage" class="error-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{{ errorMessage }}</span>
                </div>

                <div v-if="successMessage" class="success-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="success-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 12l2 2 6-6"></path>
                  </svg>
                  <span>{{ successMessage }}</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="save-button"
                    :disabled="isSubmitting || !isFormValid"
                >
                  <span v-if="isSubmitting" class="button-spinner"></span>
                  <span v-else>Change Access Code</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Window Password Settings (Expandable) -->
          <div v-if="showWindowPasswordSettings" class="settings-card password-settings-section">
            <div class="card-header">
              <h4>Change Window Access Code</h4>
            </div>
            <div class="card-content">
              <form @submit.prevent="changeWindowPassword" class="settings-form">
                <!-- Window Selection -->
                <div class="form-group">
                  <label for="window-select">Window Number</label>
                  <div class="select-wrapper">
                    <select
                        id="window-select"
                        v-model="selectedWindowNumber"
                        required
                        :disabled="isSubmittingWindowPassword"
                    >
                      <option value="" disabled>Select window</option>
                      <option v-for="window in branchWindows" :key="window.number" :value="window.number" class="window-option">
                        Window {{ window.number }}
                        {{ window.staff && window.staff.firstName ? `(${window.staff.firstName} ${window.staff.lastName})` : '' }}
                      </option>
                      <option v-if="branchWindows.length === 0" value="" disabled class="no-windows-message">No windows found</option>
                    </select>
                  </div>
                  <p v-if="branchWindows.length === 0" class="helper-text">
                    No windows configured. Please go to Window Management to add windows first.
                  </p>
                </div>

                <!-- Current Window Password -->
                <div class="form-group">
                  <label for="current-window-password">Current Window Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="current-window-password"
                        v-model="currentWindowPassword"
                        :type="showCurrentWindowPassword ? 'text' : 'password'"
                        placeholder="Enter current window access code"
                        required
                        :disabled="isSubmittingWindowPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleCurrentWindowPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showCurrentWindowPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                </div>

                <!-- New Window Password -->
                <div class="form-group">
                  <label for="new-window-password">New Window Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="new-window-password"
                        v-model="newWindowPassword"
                        :type="showNewWindowPassword ? 'text' : 'password'"
                        placeholder="Enter new window access code"
                        required
                        :disabled="isSubmittingWindowPassword"
                        @input="validateNewWindowPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleNewWindowPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showNewWindowPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                  <div v-if="newWindowPasswordError" class="input-error">
                    {{ newWindowPasswordError }}
                  </div>
                </div>

                <!-- Confirm New Window Password -->
                <div class="form-group">
                  <label for="confirm-window-password">Confirm New Window Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="confirm-window-password"
                        v-model="confirmWindowPassword"
                        :type="showConfirmWindowPassword ? 'text' : 'password'"
                        placeholder="Confirm new window access code"
                        required
                        :disabled="isSubmittingWindowPassword"
                        @input="validateConfirmWindowPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleConfirmWindowPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showConfirmWindowPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                  <div v-if="confirmWindowPasswordError" class="input-error">
                    {{ confirmWindowPasswordError }}
                  </div>
                </div>

                <!-- Window Password Requirements -->
                <div class="password-requirements">
                  <h5>Password Requirements:</h5>
                  <ul>
                    <li :class="{ met: windowPasswordLength }">At least 6 characters long</li>
                    <li :class="{ met: windowPasswordHasUppercase }">At least one uppercase letter</li>
                    <li :class="{ met: windowPasswordHasLowercase }">At least one lowercase letter</li>
                    <li :class="{ met: windowPasswordHasNumber }">At least one number</li>
                  </ul>
                </div>

                <!-- Status Messages -->
                <div v-if="windowErrorMessage" class="error-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{{ windowErrorMessage }}</span>
                </div>

                <div v-if="windowSuccessMessage" class="success-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="success-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 12l2 2 6-6"></path>
                  </svg>
                  <span>{{ windowSuccessMessage }}</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="save-button"
                    :disabled="isSubmittingWindowPassword || !isWindowFormValid"
                >
                  <span v-if="isSubmittingWindowPassword" class="button-spinner"></span>
                  <span v-else>Change Window Access Code</span>
                </button>
              </form>
            </div>
          </div>

          <!-- Check-in Password Settings (Expandable) -->
          <div v-if="showCheckinPasswordSettings" class="settings-card password-settings-section">
            <div class="card-header">
              <h4>Change Check-in Access Code</h4>
            </div>
            <div class="card-content">
              <form @submit.prevent="changeCheckinPassword" class="settings-form">
                <!-- Current Check-in Password -->
                <div class="form-group">
                  <label for="current-checkin-password">Current Check-in Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="current-checkin-password"
                        v-model="currentCheckinPassword"
                        :type="showCurrentCheckinPassword ? 'text' : 'password'"
                        placeholder="Enter current check-in access code"
                        required
                        :disabled="isSubmittingCheckinPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleCurrentCheckinPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showCurrentCheckinPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                </div>

                <!-- New Check-in Password -->
                <div class="form-group">
                  <label for="new-checkin-password">New Check-in Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="new-checkin-password"
                        v-model="newCheckinPassword"
                        :type="showNewCheckinPassword ? 'text' : 'password'"
                        placeholder="Enter new check-in access code"
                        required
                        :disabled="isSubmittingCheckinPassword"
                        @input="validateNewCheckinPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleNewCheckinPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showNewCheckinPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                  <div v-if="newCheckinPasswordError" class="input-error">
                    {{ newCheckinPasswordError }}
                  </div>
                </div>

                <!-- Confirm New Check-in Password -->
                <div class="form-group">
                  <label for="confirm-checkin-password">Confirm New Check-in Access Code</label>
                  <div class="input-wrapper">
                    <input
                        id="confirm-checkin-password"
                        v-model="confirmCheckinPassword"
                        :type="showConfirmCheckinPassword ? 'text' : 'password'"
                        placeholder="Confirm new check-in access code"
                        required
                        :disabled="isSubmittingCheckinPassword"
                        @input="validateConfirmCheckinPassword"
                    >
                    <button
                        type="button"
                        class="password-toggle"
                        @click="toggleConfirmCheckinPasswordVisibility"
                        tabindex="-1"
                    >
                      <i v-if="showConfirmCheckinPassword">👁️</i>
                      <i v-else>👁️‍🗨️</i>
                    </button>
                  </div>
                  <div v-if="confirmCheckinPasswordError" class="input-error">
                    {{ confirmCheckinPasswordError }}
                  </div>
                </div>

                <!-- Check-in Password Requirements -->
                <div class="password-requirements">
                  <h5>Password Requirements:</h5>
                  <ul>
                    <li :class="{ met: checkinPasswordLength }">At least 6 characters long</li>
                    <li :class="{ met: checkinPasswordHasUppercase }">At least one uppercase letter</li>
                    <li :class="{ met: checkinPasswordHasLowercase }">At least one lowercase letter</li>
                    <li :class="{ met: checkinPasswordHasNumber }">At least one number</li>
                  </ul>
                </div>

                <!-- Status Messages -->
                <div v-if="checkinErrorMessage" class="error-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span>{{ checkinErrorMessage }}</span>
                </div>

                <div v-if="checkinSuccessMessage" class="success-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="success-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 12l2 2 6-6"></path>
                  </svg>
                  <span>{{ checkinSuccessMessage }}</span>
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    class="save-button"
                    :disabled="isSubmittingCheckinPassword || !isCheckinFormValid"
                >
                  <span v-if="isSubmittingCheckinPassword" class="button-spinner"></span>
                  <span v-else>Change Check-in Access Code</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { axiosInstance } from '@/main';

export default {
  name: 'BranchSettings',
  data() {
    return {
      // Branch info
      branchId: '',
      branchName: '',
      bankName: '',
      bankId: '',
      branchWindows: [],

      // Settings sections visibility
      showPasswordSettings: false,
      showWindowPasswordSettings: false,
      showCheckinPasswordSettings: false,

      // Branch Password change form
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,

      // Window Password change form
      selectedWindowNumber: '',
      currentWindowPassword: '',
      newWindowPassword: '',
      confirmWindowPassword: '',
      showCurrentWindowPassword: false,
      showNewWindowPassword: false,
      showConfirmWindowPassword: false,

      // Check-in Password change form
      currentCheckinPassword: '',
      newCheckinPassword: '',
      confirmCheckinPassword: '',
      showCurrentCheckinPassword: false,
      showNewCheckinPassword: false,
      showConfirmCheckinPassword: false,

      // Form state - Branch Password
      errorMessage: '',
      successMessage: '',
      isSubmitting: false,
      newPasswordError: '',
      confirmPasswordError: '',

      // Form state - Window Password
      windowErrorMessage: '',
      windowSuccessMessage: '',
      isSubmittingWindowPassword: false,
      newWindowPasswordError: '',
      confirmWindowPasswordError: '',

      // Form state - Check-in Password
      checkinErrorMessage: '',
      checkinSuccessMessage: '',
      isSubmittingCheckinPassword: false,
      newCheckinPasswordError: '',
      confirmCheckinPasswordError: '',

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
      }
    };
  },

  computed: {
    // Branch Password strength indicators
    passwordLength() {
      return this.newPassword.length >= 8;
    },
    passwordHasUppercase() {
      return /[A-Z]/.test(this.newPassword);
    },
    passwordHasLowercase() {
      return /[a-z]/.test(this.newPassword);
    },
    passwordHasNumber() {
      return /[0-9]/.test(this.newPassword);
    },

    // Window Password strength indicators
    windowPasswordLength() {
      return this.newWindowPassword.length >= 6;
    },
    windowPasswordHasUppercase() {
      return /[A-Z]/.test(this.newWindowPassword);
    },
    windowPasswordHasLowercase() {
      return /[a-z]/.test(this.newWindowPassword);
    },
    windowPasswordHasNumber() {
      return /[0-9]/.test(this.newWindowPassword);
    },

    // Check-in Password strength indicators
    checkinPasswordLength() {
      return this.newCheckinPassword.length >= 6;
    },
    checkinPasswordHasUppercase() {
      return /[A-Z]/.test(this.newCheckinPassword);
    },
    checkinPasswordHasLowercase() {
      return /[a-z]/.test(this.newCheckinPassword);
    },
    checkinPasswordHasNumber() {
      return /[0-9]/.test(this.newCheckinPassword);
    },

    // Form validation
    isFormValid() {
      return (
          this.currentPassword &&
          this.newPassword &&
          this.confirmPassword &&
          this.passwordLength &&
          this.passwordHasUppercase &&
          this.passwordHasLowercase &&
          this.passwordHasNumber &&
          this.newPassword === this.confirmPassword &&
          !this.newPasswordError &&
          !this.confirmPasswordError
      );
    },

    // Window Form validation
    isWindowFormValid() {
      return (
          this.selectedWindowNumber &&
          this.currentWindowPassword &&
          this.newWindowPassword &&
          this.confirmWindowPassword &&
          this.windowPasswordLength &&
          this.windowPasswordHasUppercase &&
          this.windowPasswordHasLowercase &&
          this.windowPasswordHasNumber &&
          this.newWindowPassword === this.confirmWindowPassword &&
          !this.newWindowPasswordError &&
          !this.confirmWindowPasswordError
      );
    },

    // Check-in Form validation
    isCheckinFormValid() {
      return (
          this.currentCheckinPassword &&
          this.newCheckinPassword &&
          this.confirmCheckinPassword &&
          this.checkinPasswordLength &&
          this.checkinPasswordHasUppercase &&
          this.checkinPasswordHasLowercase &&
          this.checkinPasswordHasNumber &&
          this.newCheckinPassword === this.confirmCheckinPassword &&
          !this.newCheckinPasswordError &&
          !this.confirmCheckinPasswordError
      );
    }
  },

  mounted() {
    this.loadBranchInfo();
    this.loadBranchWindows();
  },

  methods: {
    // Toggle settings sections
    togglePasswordSettings() {
      this.showPasswordSettings = !this.showPasswordSettings;
      if (this.showPasswordSettings) {
        this.showWindowPasswordSettings = false;
        this.showCheckinPasswordSettings = false;
      }

      // Clear form and errors when closing
      if (!this.showPasswordSettings) {
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.errorMessage = '';
        this.successMessage = '';
        this.newPasswordError = '';
        this.confirmPasswordError = '';
      }
    },

    toggleWindowPasswordSettings() {
      this.showWindowPasswordSettings = !this.showWindowPasswordSettings;
      if (this.showWindowPasswordSettings) {
        this.loadBranchWindows(); // Reload windows when section is opened
        this.showPasswordSettings = false;
        this.showCheckinPasswordSettings = false;
      }

      // Clear form and errors when closing
      if (!this.showWindowPasswordSettings) {
        this.selectedWindowNumber = '';
        this.currentWindowPassword = '';
        this.newWindowPassword = '';
        this.confirmWindowPassword = '';
        this.windowErrorMessage = '';
        this.windowSuccessMessage = '';
        this.newWindowPasswordError = '';
        this.confirmWindowPasswordError = '';
      }
    },

    toggleCheckinPasswordSettings() {
      this.showCheckinPasswordSettings = !this.showCheckinPasswordSettings;
      if (this.showCheckinPasswordSettings) {
        this.showPasswordSettings = false;
        this.showWindowPasswordSettings = false;
      }

      // Clear form and errors when closing
      if (!this.showCheckinPasswordSettings) {
        this.currentCheckinPassword = '';
        this.newCheckinPassword = '';
        this.confirmCheckinPassword = '';
        this.checkinErrorMessage = '';
        this.checkinSuccessMessage = '';
        this.newCheckinPasswordError = '';
        this.confirmCheckinPasswordError = '';
      }
    },

    loadBranchInfo() {
      this.branchId = localStorage.getItem('branchId');
      this.branchName = localStorage.getItem('branchName');
      this.bankName = localStorage.getItem('bankName');
      this.bankId = localStorage.getItem('bankId');

      if (!this.branchId || !this.bankId) {
        this.$router.push({name: 'BranchLogin'});
      }
    },

    // If needed, make sure this matches your actual API endpoint pattern
    async loadBranchWindows() {
      try {
        console.log('Fetching windows for branch:', this.branchId);
        // Remove the /api prefix since it's already in the baseURL
        const response = await axiosInstance.get(`/branch/${this.branchId}/windows`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('branchToken')}`
          }
        });
        console.log('Windows data received:', response.data);
        this.branchWindows = response.data || [];
      } catch (error) {
        console.error('Error loading branch windows:', error);
      }
    },

    getBankLogo(bankName) {
      return this.bankLogos[bankName] || '/logos/default-bank.png';
    },

    // Password visibility toggles - Branch Password
    toggleCurrentPasswordVisibility() {
      this.showCurrentPassword = !this.showCurrentPassword;
    },

    toggleNewPasswordVisibility() {
      this.showNewPassword = !this.showNewPassword;
    },

    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },

    // Password visibility toggles - Window Password
    toggleCurrentWindowPasswordVisibility() {
      this.showCurrentWindowPassword = !this.showCurrentWindowPassword;
    },

    toggleNewWindowPasswordVisibility() {
      this.showNewWindowPassword = !this.showNewWindowPassword;
    },

    toggleConfirmWindowPasswordVisibility() {
      this.showConfirmWindowPassword = !this.showConfirmWindowPassword;
    },

    // Password visibility toggles - Check-in Password
    toggleCurrentCheckinPasswordVisibility() {
      this.showCurrentCheckinPassword = !this.showCurrentCheckinPassword;
    },

    toggleNewCheckinPasswordVisibility() {
      this.showNewCheckinPassword = !this.showNewCheckinPassword;
    },

    toggleConfirmCheckinPasswordVisibility() {
      this.showConfirmCheckinPassword = !this.showConfirmCheckinPassword;
    },

    // Password validation - Branch Password
    validateNewPassword() {
      this.newPasswordError = '';
      this.successMessage = '';

      if (this.newPassword && this.newPassword.length < 8) {
        this.newPasswordError = 'Password must be at least 8 characters long';
      } else if (this.newPassword && !this.passwordHasUppercase) {
        this.newPasswordError = 'Password must contain at least one uppercase letter';
      } else if (this.newPassword && !this.passwordHasLowercase) {
        this.newPasswordError = 'Password must contain at least one lowercase letter';
      } else if (this.newPassword && !this.passwordHasNumber) {
        this.newPasswordError = 'Password must contain at least one number';
      }

      this.validateConfirmPassword();
    },

    validateConfirmPassword() {
      this.confirmPasswordError = '';

      if (this.confirmPassword && this.newPassword !== this.confirmPassword) {
        this.confirmPasswordError = 'Passwords do not match';
      }
    },

    // Password validation - Window Password
    validateNewWindowPassword() {
      this.newWindowPasswordError = '';
      this.windowSuccessMessage = '';

      if (this.newWindowPassword && this.newWindowPassword.length < 6) {
        this.newWindowPasswordError = 'Password must be at least 6 characters long';
      } else if (this.newWindowPassword && !this.windowPasswordHasUppercase) {
        this.newWindowPasswordError = 'Password must contain at least one uppercase letter';
      } else if (this.newWindowPassword && !this.windowPasswordHasLowercase) {
        this.newWindowPasswordError = 'Password must contain at least one lowercase letter';
      } else if (this.newWindowPassword && !this.windowPasswordHasNumber) {
        this.newWindowPasswordError = 'Password must contain at least one number';
      }

      this.validateConfirmWindowPassword();
    },

    validateConfirmWindowPassword() {
      this.confirmWindowPasswordError = '';

      if (this.confirmWindowPassword && this.newWindowPassword !== this.confirmWindowPassword) {
        this.confirmWindowPasswordError = 'Passwords do not match';
      }
    },

    // Password validation - Check-in Password
    validateNewCheckinPassword() {
      this.newCheckinPasswordError = '';
      this.checkinSuccessMessage = '';

      if (this.newCheckinPassword && this.newCheckinPassword.length < 6) {
        this.newCheckinPasswordError = 'Password must be at least 6 characters long';
      } else if (this.newCheckinPassword && !this.checkinPasswordHasUppercase) {
        this.newCheckinPasswordError = 'Password must contain at least one uppercase letter';
      } else if (this.newCheckinPassword && !this.checkinPasswordHasLowercase) {
        this.newCheckinPasswordError = 'Password must contain at least one lowercase letter';
      } else if (this.newCheckinPassword && !this.checkinPasswordHasNumber) {
        this.newCheckinPasswordError = 'Password must contain at least one number';
      }

      this.validateConfirmCheckinPassword();
    },

    validateConfirmCheckinPassword() {
      this.confirmCheckinPasswordError = '';

      if (this.confirmCheckinPassword && this.newCheckinPassword !== this.confirmCheckinPassword) {
        this.confirmCheckinPasswordError = 'Passwords do not match';
      }
    },

    // Change branch password submission
    async changePassword() {
      if (!this.isFormValid) return;

      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const response = await axiosInstance.post(`/banks/branch-password-update`, {
          branchId: this.branchId,
          currentPassword: this.currentPassword,
          newPassword: this.newPassword
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('branchToken')}`
          }
        });

        console.log('Password change successful:', response.data);

        this.successMessage = 'Your access code has been successfully updated';

        // Clear form
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';

        // Close password section after success
        setTimeout(() => {
          this.togglePasswordSettings();
          this.successMessage = '';
        }, 3000);

      } catch (error) {
        console.error('Password change error:', error);

        if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Server responded with error:', error.response.data);
          this.errorMessage = error.response.data.error || 'Failed to change password';
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          this.errorMessage = 'No response from server. Check your connection.';
        } else {
          // Something happened in setting up the request
          console.error('Error setting up request:', error.message);
          this.errorMessage = 'An unexpected error occurred. Please try again.';
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    // Change window password submission
    async changeWindowPassword() {
      if (!this.isWindowFormValid) return;

      this.isSubmittingWindowPassword = true;
      this.windowErrorMessage = '';
      this.windowSuccessMessage = '';

      try {
        // Format window ID by appending window number to branch ID, matching login approach
        const windowBranchId = this.branchId + String(this.selectedWindowNumber);

        // Fix the API endpoint path by removing the leading /api
        const response = await axiosInstance.post(`/banks/window-password-update`, {
          branchId: this.branchId,
          windowNumber: this.selectedWindowNumber,
          windowBranchId: windowBranchId,
          currentPassword: this.currentWindowPassword,
          newPassword: this.newWindowPassword
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('branchToken')}`
          }
        });

        // Rest of your code remains the same
        console.log('Window password change successful:', response.data);
        this.windowSuccessMessage = `Window ${this.selectedWindowNumber} access code has been successfully updated`;

        // Clear form
        this.currentWindowPassword = '';
        this.newWindowPassword = '';
        this.confirmWindowPassword = '';

        // Close password section after success
        setTimeout(() => {
          this.toggleWindowPasswordSettings();
          this.windowSuccessMessage = '';
        }, 3000);

      } catch (error) {
        // Error handling remains the same
        console.error('Window password change error:', error);

        if (error.response) {
          console.error('Server responded with error:', error.response.data);
          this.windowErrorMessage = error.response.data.error || 'Failed to change window password';
        } else if (error.request) {
          console.error('No response received:', error.request);
          this.windowErrorMessage = 'No response from server. Check your connection.';
        } else {
          console.error('Error setting up request:', error.message);
          this.windowErrorMessage = 'An unexpected error occurred. Please try again.';
        }
      } finally {
        this.isSubmittingWindowPassword = false;
      }
    },

    // Change check-in password submission
    async changeCheckinPassword() {
      if (!this.isCheckinFormValid) return;

      this.isSubmittingCheckinPassword = true;
      this.checkinErrorMessage = '';
      this.checkinSuccessMessage = '';

      try {
        // Fix the API endpoint path by removing the leading /api
        const response = await axiosInstance.post(`/banks/checkin-password-update`, {
          branchId: this.branchId,
          currentPassword: this.currentCheckinPassword,
          newPassword: this.newCheckinPassword
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('branchToken')}`
          }
        });

        // Rest of your code remains the same
        console.log('Check-in password change successful:', response.data);
        this.checkinSuccessMessage = 'Check-in access code has been successfully updated';

        // Clear form
        this.currentCheckinPassword = '';
        this.newCheckinPassword = '';
        this.confirmCheckinPassword = '';

        // Close password section after success
        setTimeout(() => {
          this.toggleCheckinPasswordSettings();
          this.checkinSuccessMessage = '';
        }, 3000);

      } catch (error) {
        // Error handling remains the same
        console.error('Check-in password change error:', error);

        if (error.response) {
          console.error('Server responded with error:', error.response.data);
          this.checkinErrorMessage = error.response.data.error || 'Failed to change check-in password';
        } else if (error.request) {
          console.error('No response received:', error.request);
          this.checkinErrorMessage = 'No response from server. Check your connection.';
        } else {
          console.error('Error setting up request:', error.message);
          this.checkinErrorMessage = 'An unexpected error occurred. Please try again.';
        }
      } finally {
        this.isSubmittingCheckinPassword = false;
      }
    },

    // Navigation methods
    navigateToDashboard() {
      this.$router.push({ name: 'BranchDashboard' });
    },

    navigateToAppointments() {
      this.$router.push({ name: 'BranchAppointments' });
    },

    navigateToReports() {
      this.$router.push({ name: 'BranchReports' });
    },

    logout() {
      localStorage.removeItem('branchToken');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchName');
      localStorage.removeItem('bankName');
      localStorage.removeItem('bankId');
      this.$router.push({name: 'BranchLogin'});
    }
  }
};
</script>

<style scoped>
/* Base styles, matching dashboard */
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

/* Settings Specific Styles */
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h3 {
  margin: 0;
  color: #2d3748;
  font-weight: 600;
}

/* Settings Card */
.settings-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}


.card-header {
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
}

.card-header h4 {
  margin: 0;
  color: #2d3748;
  font-weight: 600;
  font-size: 1.1rem;
}

.card-content {
  padding: 0.5rem 0;
}

/* Branch Info Details */
.branch-info-details {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  width: 150px;
  color: #64748b;
  font-size: 0.9rem;
}

.info-value {
  flex: 1;
  font-weight: 600;
  color: #2d3748;
}



/* Settings Options */
.settings-options {
  margin-bottom: 1.5rem;
}

.settings-option-card {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.settings-option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.option-icon {
  font-size: 1.75rem;
  margin-right: 1.25rem;
  background-color: rgba(66, 185, 131, 0.1);
  color: #42b983;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-content {
  flex: 1;
}

.option-content h4 {
  margin: 0 0 0.25rem 0;
  color: #2d3748;
  font-weight: 600;
}

.option-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.option-arrow {
  font-size: 1.1rem;
  color: #64748b;
  transition: transform 0.3s;
}

/* Password Settings Section (Expandable) */
.password-settings-section {
  margin-top: -0.5rem;
  border-top: 2px solid #42b983;
  animation: fadeInDown 0.3s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Form Styles */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #2d3748;
  font-weight: 500;
  font-size: 0.95rem;
}

.input-wrapper {
  position: relative;
  width: 100%;
  max-width: 100%;
}

.input-wrapper input {
  width: 100%;
  max-width: 100%;
  padding: 12px 16px;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s ease;
  font-size: 1.2rem;
}

.password-toggle:hover {
  opacity: 1;
}

.input-error {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

/* Password Requirements */
.password-requirements {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.password-requirements h5 {
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  font-size: 0.9rem;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #718096;
  font-size: 0.85rem;
}

.password-requirements li::before {
  content: "○";
  margin-right: 0.5rem;
  color: #cbd5e0;
}

.password-requirements li.met {
  color: #2d3748;
}

.password-requirements li.met::before {
  content: "●";
  color: #42b983;
}

/* Status Messages */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #fff6f6;
  border-left: 3px solid #e74c3c;
  border-radius: 4px;
  color: #c0392b;
  font-size: 0.9rem;
  animation: fadeInUp 0.3s ease;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #f0fff4;
  border-left: 3px solid #42b983;
  border-radius: 4px;
  color: #2f855a;
  font-size: 0.9rem;
  animation: fadeInUp 0.3s ease;
}

.error-icon,
.success-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.error-icon {
  stroke: #e74c3c;
}

.success-icon {
  stroke: #42b983;
}

/* Save Button */
.save-button {
  width: 100%;
  padding: 14px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.save-button:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.2);
}

.save-button:active {
  transform: translateY(0);
}

.save-button:disabled {
  background-color: #b8e5d2;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-spinner {
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 3px solid white;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
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
}

@media (max-width: 768px) {
  .settings-container {
    padding: 0;
  }

  .option-icon {
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
  }

  .option-content h4 {
    font-size: 1rem;
  }

  .option-content p {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .info-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    width: 100%;
  }

  .settings-option-card {
    padding: 1rem;
  }
}


/* Add styles for select wrapper */
.select-wrapper {
  position: relative;
  width: 100%;
}

.select-wrapper select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
  appearance: none;
  background-color: white;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.select-wrapper select:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

.select-wrapper select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Custom styling for selected option */
.select-wrapper select option {
  padding: 12px;
}

/* Hover effect for select */
.select-wrapper:hover select:not(:disabled) {
  border-color: #42b983;
}

/* When dropdown is open */
.select-wrapper select:active,
.select-wrapper select:focus {
  border-color: #42b983;
}

/* Style for window options */
.window-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.window-option {
  font-weight: bold;
}

.window-option {
  font-size: 0.9em;
  color: #718096;
}

/* Empty state styling */
select option[disabled]:first-child {
  color: #a0aec0;
}

/* No windows found message */
.no-windows-message {
  color: #e53e3e;
  font-style: italic;
}

.helper-text {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #718096;
}
</style>