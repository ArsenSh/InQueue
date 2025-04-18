<template>
  <div class="checkin-view">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <img :src="getBankLogo(bankName)" alt="Bank Logo" class="bank-logo">
        <h1>{{ bankName }} - {{ branchName }}</h1>
      </div>
      <div class="auth-section" v-if="!isAuthenticated">
        <button @click="showLoginForm = true" class="login-btn">Staff Login</button>
      </div>
      <div class="auth-section" v-else>
        <span class="staff-name">{{ staffName }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </div>

    <!-- Main content -->
    <div class="main-content">
      <!-- Scanning mode -->
      <div v-if="isAuthenticated" class="scanner-section">
        <div class="scanner-header">
          <h2>Client Check-in Scanner</h2>
          <div class="scan-stats">
            <div class="stat-box">
              <div class="stat-title">Today's Check-ins</div>
              <div class="stat-value">{{ todayCheckins }}</div>
            </div>
            <div class="stat-box">
              <div class="stat-title">Last Check-in</div>
              <div class="stat-value">{{ lastCheckinTime || 'None' }}</div>
            </div>
          </div>
        </div>

        <div class="scanner-container">
          <div class="video-container">
            <video ref="videoRef" autoplay playsinline></video>
            <div class="scanner-frame"></div>
            <div class="scanner-line"></div>
          </div>

          <div class="scanner-info">
            <div class="instructions">
              <h3>How to Check In</h3>
              <ol>
                <li>Show your appointment QR code</li>
                <li>Align the QR code within the scanner frame</li>
                <li>The system will automatically detect and process the code</li>
              </ol>
            </div>

            <div class="manual-entry">
              <h3>Or Enter Appointment Code Manually</h3>
              <div class="form-group">
                <input
                    type="text"
                    v-model="manualCode"
                    placeholder="Enter 4-digit appointment code"
                    pattern="[0-9]{4}"
                    maxlength="4"
                />
                <button @click="processManualCode" :disabled="!manualCode || manualCode.length !== 4">Check In</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent check-ins -->
        <div class="recent-checkins">
          <h3>Recent Check-ins</h3>
          <div v-if="recentCheckins.length === 0" class="no-checkins">
            No recent check-ins
          </div>
          <div v-else class="checkins-list">
            <div v-for="checkin in recentCheckins" :key="checkin._id" class="checkin-item">
              <div class="checkin-time">{{ formatTime(checkin.checkinTime) }}</div>
              <div class="checkin-details">
                <div class="client-name">{{ checkin.customerName }}</div>
                <div class="appointment-type">{{ checkin.service?.type || 'N/A' }}</div>
              </div>
              <div class="checkin-status" :class="checkin.status">{{ checkin.status }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Public view (when not authenticated) - now redirects to Login page -->
      <div v-else class="public-view">
        <div class="welcome-screen">
          <h2>Redirecting to login...</h2>
          <p>Please wait while we redirect you to the login page.</p>
        </div>
      </div>
    </div>

    <!-- Success notification -->
    <div v-if="showSuccess" class="success-notification">
      <div class="success-content">
        <div class="success-icon">✓</div>
        <h3>Check-in Successful!</h3>
        <div class="client-details">
          <p><strong>Name:</strong> {{ checkedInClient.customerName }}</p>
          <p><strong>Appointment:</strong> {{ checkedInClient.service?.type || 'N/A' }}</p>
          <p><strong>Time:</strong> {{ formatAppointmentTime(checkedInClient.timeSlot) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { axiosInstance } from '@/main';
import jsQR from 'jsqr';

export default {
  name: 'CheckInView',
  data() {
    return {
      isAuthenticated: false,
      staffName: '',
      bankName: '',
      branchName: '',
      branchId: '',
      scanning: false,
      videoStream: null,
      manualCode: '',
      recentCheckins: [],
      todayCheckins: 0,
      lastCheckinTime: null,
      showSuccess: false,
      checkedInClient: {},
      scannerInterval: null,
      refreshInterval: null,
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
      const token = localStorage.getItem('branchToken');
      return {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      };
    }
  },
  created() {
    const role = localStorage.getItem('role');
    if (role !== 'checkin_staff') {
      this.$router.push({ name: 'BranchLogin' });
    }
  },
  mounted() {
    // Checks if already authenticated
    const token = localStorage.getItem('branchToken');
    if (token) {
      this.isAuthenticated = true;
      this.branchId = localStorage.getItem('branchId');
      this.branchName = localStorage.getItem('branchName');
      this.bankName = localStorage.getItem('bankName');
      this.staffName = localStorage.getItem('staffName') || 'Check-in';

      // Starts scanner and load data
      this.startScanner();
      this.loadCheckinData();

      // Sets up auto-refresh for check-in data
      this.refreshInterval = setInterval(() => {
        this.loadCheckinData();
      }, 30000); // Refresh every 30 seconds
    } else {
      // Redirects to login page if not authenticated
      this.$router.push({ name: 'BranchLogin' });
    }
  },
  beforeUnmount() {
    this.stopScanner();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    logout() {
      // Stops scanner
      this.stopScanner();

      // Clears refresh interval
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }

      // Clears localStorage
      localStorage.removeItem('branchToken');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchName');
      localStorage.removeItem('bankName');
      localStorage.removeItem('staffName');
      localStorage.removeItem('role');

      // Resets component state
      this.isAuthenticated = false;
      this.branchId = '';
      this.branchName = '';
      this.bankName = '';
      this.staffName = '';
      this.recentCheckins = [];
      // Redirects to login page
      this.$router.push({ name: 'BranchLogin' });
    },

    getBankLogo(bankName) {
      if (this.bankLogos[bankName]) {
        return this.bankLogos[bankName];
      }
      return '/logos/default-bank.png';
    },

    async loadCheckinData() {
      if (!this.isAuthenticated) return;

      try {
        const today = new Date();
        const formattedDate = this.formatDateForAPI(today);
        const response = await axiosInstance.get(
            `/branch/${this.branchId}/checkins/${formattedDate}`,
            this.authHeaders
        );

        this.todayCheckins = response.data.totalCheckins || 0;

        // Formats and updates recent check-ins
        const checkins = response.data.checkins || [];
        this.recentCheckins = checkins.slice(0, 10).map(checkin => ({
          ...checkin,
          checkinTime: new Date(checkin.checkinTime)
        }));

        // Updates last check-in time
        if (checkins.length > 0) {
          const latestCheckin = checkins.reduce((latest, current) => {
            const currentTime = new Date(current.checkinTime);
            return !latest.checkinTime || currentTime > new Date(latest.checkinTime) ? current : latest;
          }, {});

          this.lastCheckinTime = this.formatTime(new Date(latestCheckin.checkinTime));
        }
      } catch (error) {
        console.error('Error loading check-in data:', error);
      }
    },

    startScanner() {
      // Checks for camera permissions and availability
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support camera access');
        return;
      }
      // Access the camera feed
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
            this.videoStream = stream;
            const video = this.$refs.videoRef;
            video.srcObject = stream;
            video.setAttribute('playsinline', true);

            video.onloadedmetadata = () => {
              video.play();
              this.scanning = true;
              // Creates a canvas for QR code processing
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              // Starts scanning loop
              this.scannerInterval = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                  canvas.height = video.videoHeight;
                  canvas.width = video.videoWidth;
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height);
                  if (code) {
                    console.log('QR code detected:', code.data);
                    this.processQRCode(code.data);
                  }
                }
              }, 500); // Process every 500ms
            };
          })
          .catch(error => {
            console.error('Error accessing camera:', error);
          });
    },

    stopScanner() {
      this.scanning = false;
      if (this.scannerInterval) {
        clearInterval(this.scannerInterval);
      }
      if (this.videoStream) {
        const tracks = this.videoStream.getTracks();
        tracks.forEach(track => track.stop());
        this.videoStream = null;
      }
    },

    async processQRCode(qrData) {
      // Temporarily pauses scanning to avoid duplicate processing
      clearInterval(this.scannerInterval);
      try {
        let appointmentData = {};

        try {
          const parsedData = JSON.parse(qrData);
          console.log('Parsed QR data:', parsedData);
          if (parsedData.password) {
            appointmentData.code =  parsedData.password ;
          }
          if (parsedData.id) {
            appointmentData.appointmentId = parsedData.id ;
          }
        } catch (e) {
          appointmentData = { code: qrData };
        }

        console.log('Sending check-in data:', appointmentData);
        await this.processCheckin(appointmentData);
      } catch (error) {
        console.error('Error processing QR code:', error);
      } finally {
        setTimeout(() => {
          if (this.scanning) {
            this.startScanner();
          }
        }, 2000);
      }
    },

    async processManualCode() {
      if (!this.manualCode || this.manualCode.length !== 4) {
        return;
      }
      console.log('Processing manual code:', this.manualCode);
      try {
        const findResponse = await axiosInstance.get(
            `/appointment-by-code/${this.manualCode}`
        );
        if (findResponse.data && findResponse.data.appointment) {
          await this.processCheckin({
            appointmentId: findResponse.data.appointment._id,
            code: this.manualCode
          });
        } else {
          await this.processCheckin({ code: this.manualCode });
        }
        this.manualCode = '';
      } catch (error) {
        console.error('Error processing manual code:', error);
      }
    },

    async processCheckin(data) {
      try {
        console.log('About to make check-in request with data:', data);
        const response = await axiosInstance.post(
            `/branch/${this.branchId}/checkin`,
            data,
            this.authHeaders
        );
        this.checkedInClient = response.data.appointment;
        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
        }, 5000);

        this.loadCheckinData();
      } catch (error) {
        console.error('Check-in error:', error);
        if (error.response && error.response.data && error.response.data.error) {
          alert('Check-in failed: ' + error.response.data.error);
        } else {
          alert('Check-in failed. Please try again.');
        }
      }
    },

    formatTime(date) {
      if (!date) return 'N/A';
      try {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        return 'Invalid time';
      }
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

    formatDateForAPI(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
};
</script>

<style scoped>
.checkin-view {
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
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bank-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: #42b983;
  border-radius: 8px;
  padding: 4px;
}

.logo-section h1 {
  margin: 0;
  font-size: 1.2rem;
}

.auth-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.staff-name {
  font-weight: bold;
}

.login-btn, .logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.login-btn:hover, .logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.scanner-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.scanner-header h2 {
  margin: 0;
  color: #2d3748;
}

.scan-stats {
  display: flex;
  gap: 1rem;
}

.stat-box {
  background-color: #f7fafc;
  padding: 0.8rem;
  border-radius: 6px;
  min-width: 120px;
  text-align: center;
}

.stat-title {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 0.3rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2d3748;
}

.scanner-container {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.video-container {
  position: relative;
  width: 50%;
  max-width: 400px;
  aspect-ratio: 4/3;
  background-color: #000;
  overflow: hidden;
  border-radius: 8px;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 70%;
  border: 2px solid #42b983;
  border-radius: 8px;
  box-shadow: 0 0 0 1000px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #42b983;
  box-shadow: 0 0 8px 1px rgba(66, 185, 131, 0.8);
  z-index: 11;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 15%; }
  50% { top: 85%; }
  100% { top: 15%; }
}

.scanner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.instructions h3, .manual-entry h3 {
  margin-top: 0;
  color: #2d3748;
  font-size: 1.1rem;
}

.instructions ol {
  color: #4a5568;
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.instructions li {
  margin-bottom: 0.5rem;
}

.manual-entry .form-group {
  display: flex;
  gap: 0.5rem;
}

.manual-entry input {
  flex: 1;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 1rem;
}

.manual-entry button {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.manual-entry button:hover {
  background-color: #3aa876;
}

.manual-entry button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.recent-checkins {
  margin-top: 1rem;
}

.recent-checkins h3 {
  margin-top: 0;
  color: #2d3748;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.no-checkins {
  text-align: center;
  color: #a0aec0;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 8px;
}

.checkins-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.checkin-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background-color: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #48bb78;
}

.checkin-time {
  font-weight: bold;
  color: #2d3748;
  min-width: 60px;
}

.checkin-details {
  flex: 1;
}

.client-name {
  font-weight: bold;
  color: #2d3748;
}

.appointment-type {
  font-size: 0.9rem;
  color: #718096;
}

.checkin-status {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
  background-color: #bee3f8;
  color: #2b6cb0;
}

.checkin-status {
  background-color: #c6f6d5;
  color: #2f855a;
}

.public-view {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.welcome-screen {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
}

.welcome-screen h2 {
  color: #2d3748;
  margin-bottom: 1.5rem;
}

.welcome-screen p {
  color: #4a5568;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0.5rem 0;
}

.success-notification {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.success-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #48bb78;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin: 0 auto 1rem;
}

.success-content h3 {
  color: #2d3748;
  margin-top: 0;
  margin-bottom: 1rem;
}

.client-details {
  text-align: left;
  background-color: #f7fafc;
  padding: 1rem;
  border-radius: 6px;
}

.client-details p {
  margin: 0.5rem 0;
  color: #4a5568;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .scanner-container {
    flex-direction: column;
    align-items: center;
  }

  .video-container {
    width: 100%;
    max-width: 100%;
  }

  .scanner-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .main-content {
    padding: 1rem;
  }

  .scan-stats {
    width: 100%;
  }

  .stat-box {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .header {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    text-align: center;
  }

  .logo-section {
    flex-direction: column;
  }

  .scan-stats {
    flex-direction: column;
  }

  .recent-checkins h3 {
    margin-top: 1rem;
  }
}
</style>