<template>
  <div class="login-page">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <h1 class="logo">InQueue</h1>
      <ul>
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/contactus">Contact Us</router-link></li>
      </ul>
    </nav>

    <!-- Login Container -->
    <div class="login-container">
      <div class="login-card">
        <h2 class="card-title">{{ loginTypeTitle }}</h2>
        <p class="card-subtitle">{{ loginTypeSubtitle }}</p>

        <form @submit.prevent="login" class="login-form">
          <!-- Login Type Selection -->
          <div class="form-group">
            <label for="login-type">Login Type</label>
            <div class="select-wrapper">
              <select id="login-type" v-model="loginType" @change="handleLoginTypeChange">
                <option value="branch_admin">Branch Admin</option>
                <option value="window_staff">Window Staff</option>
                <option value="checkin_staff">Check-in</option>
              </select>
            </div>
          </div>

          <!-- Branch ID Input -->
          <div class="form-group">
            <label for="branch-id">{{ branchIdLabel }}</label>
            <div class="input-wrapper">
              <input
                  id="branch-id"
                  v-model="branchId"
                  type="text"
                  :placeholder="branchIdPlaceholder"
                  required
                  @input="findMatchingBank"
              >
              <div v-if="matchedBankLogo" class="bank-logo-wrapper">
                <img
                    :src="matchedBankLogo"
                    :alt="matchedBankName + ' logo'"
                    class="bank-logo"
                />
              </div>
            </div>
          </div>

          <!-- Window Number Input (for window staff) -->
          <div class="form-group" v-if="loginType === 'window_staff'">
            <label for="window-number">Window Number</label>
            <div class="input-wrapper">
              <input
                  id="window-number"
                  v-model="windowNumber"
                  type="number"
                  placeholder="Enter window number"
                  min="1"
                  required
                  :disabled="isLoggingIn"
              >
            </div>
          </div>

          <!-- Access Code Input -->
          <div class="form-group">
            <label for="access-code">Access Code</label>
            <div class="input-wrapper">
              <input
                  id="access-code"
                  v-model="accessCode"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your access code"
                  required
                  :disabled="isLoggingIn"
              >
              <button
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility"
                  tabindex="-1"
              >
                <i v-if="showPassword">👁️</i>
                <i v-else>👁️‍🗨️</i>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="error-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Login Button -->
          <button
              type="submit"
              class="login-button"
              :disabled="isLoggingIn || !canLogin"
          >
            <span v-if="isLoggingIn" class="button-spinner"></span>
            <span v-else>Login</span>
          </button>
        </form>

        <!-- Assistance Section -->
        <div class="assistance-box">
          <div class="assistance-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <circle cx="12" cy="8" r="2"></circle>
              <path d="M8.5 14.5 10 13l2 2 4-4"></path>
            </svg>
          </div>
          <div class="assistance-text">
            <p>Need Help?</p>
            <p>Contact your bank administrator for branch access credentials or technical support.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="/terms">Terms of Service</a>
          <a href="/privacy-policy">Privacy Policy</a>
        </div>
        <div class="copyright">
          © {{ new Date().getFullYear() }} InQueue. All Rights Reserved.
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { axiosInstance } from '@/main';

export default {
  name: 'BranchLogin',
  data() {
    return {
      loginType: 'branch_admin', // Default to branch admin login
      branchId: '',
      windowNumber: '',
      accessCode: '',
      errorMessage: '',
      isLoggingIn: false,
      showPassword: false,
      matchedBankLogo: null,
      matchedBankName: '',
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
    // Dynamic titles based on login type
    loginTypeTitle() {
      switch(this.loginType) {
        case 'window_staff': return 'Window Staff Login';
        case 'checkin_staff': return 'Check-in Login';
        default: return 'Branch Admin Login';
      }
    },

    loginTypeSubtitle() {
      switch(this.loginType) {
        case 'window_staff': return 'Access your window interface to serve clients';
        case 'checkin_staff': return 'Access the check-in scanner for client appointments';
        default: return 'Access your branch dashboard and management tools';
      }
    },

    // Dynamic field labels and placeholders
    branchIdLabel() {
      switch(this.loginType) {
        case 'window_staff': return 'Branch ID';
        case 'checkin_staff': return 'Branch ID';
        default: return 'Branch ID';
      }
    },

    branchIdPlaceholder() {
      switch(this.loginType) {
        case 'window_staff': return 'Enter branch ID';
        case 'checkin_staff': return 'Enter branch ID';
        default: return 'Enter your branch ID';
      }
    },

    // Enable/disable login button
    canLogin() {
      if (this.isLoggingIn) return false;

      // Base validation for all login types
      if (!this.branchId || !this.accessCode) return false;

      // Additional validation for window staff
      if (this.loginType === 'window_staff' && !this.windowNumber) return false;

      return true;
    }
  },

  methods: {
    handleLoginTypeChange() {
      // Reset input fields when login type changes
      this.accessCode = '';
      this.errorMessage = '';

      if (this.loginType !== 'window_staff') {
        this.windowNumber = '';
      }
    },

    findMatchingBank() {
      this.matchedBankLogo = null;
      this.matchedBankName = '';

      const bankPrefix = this.branchId.split('-')[0]?.toLowerCase();

      if (bankPrefix) {
        const matchedBank = Object.keys(this.bankLogos).find(bankName =>
            bankName.toLowerCase().startsWith(bankPrefix) ||
            bankName.toLowerCase().includes(bankPrefix)
        );

        if (matchedBank) {
          this.matchedBankLogo = this.bankLogos[matchedBank];
          this.matchedBankName = matchedBank;
        }
      }
    },

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },

    async login() {
      this.isLoggingIn = true;
      this.errorMessage = '';

      try {
        // Format branchId based on login type
        let formattedBranchId = this.branchId.trim();

        if (this.loginType === 'window_staff') {
          // For window staff, append window number
          // Convert to string first to avoid errors with trim()
          formattedBranchId += String(this.windowNumber);
        } else if (this.loginType === 'checkin_staff') {
          // For check-in staff, append "CheckIn"
          formattedBranchId += 'CheckIn';
        }

        console.log('Login attempt:', {
          branchId: formattedBranchId,
          loginType: this.loginType,
          passwordLength: this.accessCode.trim().length
        });

        const response = await axiosInstance.post('/banks/branch-login', {
          branchId: formattedBranchId,
          password: this.accessCode.trim()
        });

        console.log('Login successful:', response.data);

        // Store authentication details
        localStorage.setItem('branchToken', response.data.token);
        localStorage.setItem('branchId', response.data.branchId);
        localStorage.setItem('branchName', response.data.branchName);
        localStorage.setItem('bankName', response.data.bankName);
        localStorage.setItem('bankId', response.data.bankId);
        localStorage.setItem('role', response.data.role || 'branch_admin');

        // For window staff, store additional information
        if (response.data.role === 'window_staff') {
          localStorage.setItem('windowNumber', response.data.windowNumber);
          localStorage.setItem('staffName', response.data.staffName || 'Window Staff');

          // Route to window worker view
          this.$router.push({
            name: 'WindowWorker',
            params: { windowNumber: String(response.data.windowNumber) }
          });
        }
        // For check-in staff, redirect to check-in view
        else if (response.data.role === 'checkin_staff') {
          // Store staff name for display
          localStorage.setItem('staffName', 'Check-in Staff');

          // Route to check-in view
          this.$router.push({ name: 'CheckIn' });
        }
        // For branch admin, redirect to dashboard
        else {
          this.$router.push({ name: 'BranchDashboard' });
        }
      } catch (error) {
        console.error('Full login error:', error);

        if (error.response) {
          // The request was made and the server responded with a status code
          console.error('Server responded with error:', error.response.data);
          this.errorMessage = error.response.data.error || 'Invalid credentials';
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
        this.isLoggingIn = false;
      }
    }
  }
};
</script>

<style scoped>
.input-wrapper {
  position: relative;
  width: 100%;
}

.bank-logo-wrapper {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bank-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

/* Adjust input padding to make room for logo */
.input-wrapper input {
  padding-right: 50px;
}

/* Base Styles - Matching HomePage */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: Arial, sans-serif;
  background-color: #f8f9fa;
}

/* Navigation Bar - Matching HomePage */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #42b983;
  padding: 32px 30px;
  color: white;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.navbar .logo {
  color: white;
  font-size: 1.8rem;
  margin: 0;
  font-weight: bold;
}

.navbar ul {
  list-style: none;
  display: flex;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.navbar li {
  margin: 0;
}

.navbar a {
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.3s;
  opacity: 0.9;
}

.navbar a:hover {
  opacity: 1;
}

/* Login Container */
.login-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.login-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 500px;
  padding: 2rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* Card Header */
.card-title {
  color: #2c3e50;
  font-size: 1.8rem;
  margin: 0 0 0.5rem;
  text-align: center;
}

.card-subtitle {
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 2rem;
}

@keyframes moveMarker {
  0%, 10% {
    left: 0%;
    transform: translate(-50%, -50%) rotate(0deg);
  }
  50% {
    left: 100%;
    transform: translate(-50%, -50%) rotate(360deg);
  }
  90%, 100% {
    left: 100%;
    transform: translate(-50%, -50%) rotate(720deg);
  }
}

@keyframes pulsate {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Form Styles */
.login-form {
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
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.95rem;
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

.select-wrapper select {
  border-color: #42b983;
  font-weight: 500;
}

.bank-icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 1rem;
  color: #2c3e50;
  transition: all 0.3s ease;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

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

.error-icon {
  width: 16px;
  height: 16px;
  stroke: #e74c3c;
  flex-shrink: 0;
}

.login-button {
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

.login-button:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.2);
}

.login-button:active {
  transform: translateY(0);
}

.login-button:disabled {
  background-color: #b8e5d2;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes shake {
  10%, 90% {
    transform: translateX(-1px);
  }
  20%, 80% {
    transform: translateX(2px);
  }
  30%, 50%, 70% {
    transform: translateX(-4px);
  }
  40%, 60% {
    transform: translateX(4px);
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

.assistance-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  max-width: 470px;
  margin: 24px auto 0 auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
  transition: all 0.3s ease;
}

.assistance-icon {
  background-color: #42b983;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.assistance-icon svg {
  stroke: white;
  width: 24px;
  height: 24px;
}

.assistance-text {
  text-align: left;
  flex-grow: 1;
}

.assistance-text p {
  margin: 0;
  line-height: 1.5;
}

.assistance-text p:first-child {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 6px;
}

.assistance-text p:last-child {
  color: #4a5568;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Footer - Matching HomePage */
.site-footer {
  background-color: #42b983;
  color: white;
  padding: 22px;
  text-align: center;
}

.site-footer .footer-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.site-footer .footer-links {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.site-footer .footer-links a {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  transition: opacity 0.3s;
}

.site-footer .footer-links a:hover {
  opacity: 0.8;
}

.site-footer .copyright {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    padding: 1.5rem;
  }

  .login-card {
    padding: 1.5rem;
  }

  .navbar {
    flex-direction: column;
    padding: 10px;
  }

  .navbar ul {
    margin-top: 10px;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.25rem;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .navbar {
    padding: 10px;
  }

  .navbar .logo {
    font-size: 1.5rem;
  }

  .site-footer .footer-links {
    flex-direction: column;
    gap: 10px;
  }
}

.form-group {
  width: 100%;
}

.input-wrapper {
  width: 100%;
  position: relative;
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

/* Ensure the password toggle doesn't interfere with form submission */
.password-toggle:focus {
  outline: none;
}

select, input {
  width: 100%;
  box-sizing: border-box;
}
</style>