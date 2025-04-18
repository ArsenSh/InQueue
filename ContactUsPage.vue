<template>
  <div class="contact-page">
    <!-- Navigation bar (matching HomePage) -->
    <nav class="navbar">
      <h1 class="logo">InQueue</h1>
      <ul>
        <li class="active">
          <router-link to="/">Home</router-link>
        </li>
        <li class="active">
          <router-link to="/aboutus">About Us</router-link>
        </li>
      </ul>
    </nav>

    <div class="contact-container">
      <!-- Decorative element with more subtle design -->
      <div class="contact-hero">
        <div class="decorative-shape contact-shape"></div>
        <div class="header">
          <h1>Get in Touch</h1>
          <p class="subtitle">Streamline your bank's customer experience with InQueue</p>
        </div>
      </div>

      <div class="contact-content">
        <form @submit.prevent="submitForm" class="contact-form">
          <!-- Hidden honeypot field for spam protection -->
          <input type="text" name="honeypot" v-model="form.honeypot" aria-hidden="true" />

          <div class="form-grid">
            <div class="form-card user-info">
              <h2 class="section-title">Your Information</h2>

              <div class="form-group">
                <label for="fullName">Full Name <span class="required">*</span></label>
                <div class="input-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                      id="fullName"
                      v-model="form.fullName"
                      type="text"
                      required
                      placeholder="Enter your full name"
                      :class="{ 'input-focus': isFocused.fullName }"
                      @focus="isFocused.fullName = true"
                      @blur="isFocused.fullName = false"
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="email">Email <span class="required">*</span></label>
                <div class="input-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                      id="email"
                      v-model="form.email"
                      type="email"
                      required
                      placeholder="Enter your email address"
                      :class="{ 'input-focus': isFocused.email }"
                      @focus="isFocused.email = true"
                      @blur="isFocused.email = false"
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="phone">Phone Number</label>
                <div class="input-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input
                      id="phone"
                      v-model="form.phone"
                      type="tel"
                      placeholder="Phone number (optional)"
                      :class="{ 'input-focus': isFocused.phone }"
                      @focus="isFocused.phone = true"
                      @blur="isFocused.phone = false"
                  >
                </div>
              </div>
            </div>

            <div class="form-card message-info">
              <h2 class="section-title">Your Message</h2>

              <div class="form-group">
                <label for="message">Message <span class="required">*</span></label>
                <div class="input-wrapper textarea-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" class="input-icon textarea-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <textarea
                      id="message"
                      v-model="form.message"
                      required
                      placeholder="Write your message here"
                      rows="6"
                      :class="{ 'input-focus': isFocused.message }"
                      @focus="isFocused.message = true"
                      @blur="isFocused.message = false"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="button-section">
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting">
                <span class="spinner"></span>
                Sending...
              </span>
              <span v-else>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                Send Message
              </span>
            </button>
          </div>
        </form>

        <div class="contact-info">
          <div class="info-card">
            <div class="info-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3>Email Us</h3>
            <p>inqueueue@gmail.com</p>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <h3>Call Us</h3>
            <p>+374 98 011 164</p>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3>Support Hours</h3>
            <p>Monday - Friday, 9AM - 6PM</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer (matching HomePage) -->
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
import Swal from 'sweetalert2';

export default {
  name: 'ContactForm',
  data() {
    return {
      form: {
        fullName: '',
        email: '',
        phone: '',
        message: '',
        honeypot: '' // Hidden spam trap
      },
      isSubmitting: false,
      isFocused: {
        fullName: false,
        email: false,
        phone: false,
        message: false
      }
    };
  },
  methods: {
    async submitForm() {
      if (!this.validateForm() || this.form.honeypot) return;

      this.isSubmitting = true;
      try {
        const response = await fetch('http://localhost:5000/api/banks/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(this.form)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Message Sent!',
          text: 'Thank you for contacting us. We will get back to you soon.',
          confirmButtonColor: '#5ab88a',
          timer: 2000,
          timerProgressBar: true
        });

        this.resetForm();

        // Redirect to home page after successful submission
        this.$router.push('/');
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error.message || 'Network error - please try again later',
          confirmButtonColor: '#e53935'
        });
      } finally {
        this.isSubmitting = false;
      }
    },

    validateForm() {
      // Basic client-side validation
      if (!this.form.fullName.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please enter your full name.',
          confirmButtonColor: '#5ab88a'
        });
        return false;
      }

      // Email validation with regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email.trim() || !emailRegex.test(this.form.email)) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Email',
          text: 'Please enter a valid email address.',
          confirmButtonColor: '#5ab88a'
        });
        return false;
      }

      // Optional phone number validation (if provided)
      if (this.form.phone && !/^\d{7,15}$/.test(this.form.phone.replace(/[^\d]/g, ''))) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Phone Number',
          text: 'Please enter a valid phone number.',
          confirmButtonColor: '#5ab88a'
        });
        return false;
      }

      if (!this.form.message.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Please enter a message.',
          confirmButtonColor: '#5ab88a'
        });
        return false;
      }

      return true;
    },

    resetForm() {
      this.form = {
        fullName: '',
        email: '',
        phone: '',
        message: '',
        honeypot: ''
      };

      // Reset focus states
      Object.keys(this.isFocused).forEach(key => {
        this.isFocused[key] = false;
      });
    }
  },
  mounted() {
    // Add custom validation to improve error messages
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('invalid', () => {
        input.setCustomValidity('');
        if (!input.validity.valid) {
          input.setCustomValidity('Please complete this field');
        }
      });
      input.addEventListener('input', () => {
        input.setCustomValidity('');
      });
    });
  }
};
</script>

<style scoped>

.contact-hero {
  position: relative;
  background-color: #e8f5e9;
  padding: 60px 20px 40px;
  margin: -40px -20px 40px;
  overflow: hidden;
  border-radius: 0 0 30px 30px;
}

.contact-hero .header h1 {
  color: #2c3e50;
  font-size: 2.2rem;
  margin-bottom: 10px;
}

.contact-hero .subtitle {
  color: #2c3e50;
  font-size: 1.1rem;
  max-width: 600px;
}

.contact-shape {
  top: -150px;
  right: -50px;
  width: 400px;
  height: 400px;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
}



/* Hidden honeypot field */
input[name="honeypot"] {
  display: none !important;
  visibility: hidden;
  position: absolute;
  left: -9999px;
}

/* New input wrapper styles for icons */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  color: #888;
  transition: color 0.3s ease;
}

.textarea-icon {
  position: absolute;
  top: 12px;
  left: 12px;
}

.input-wrapper input,
.input-wrapper textarea {
  padding-left: 40px;
}

.input-wrapper input:focus + .input-icon,
.input-wrapper textarea:focus + .textarea-icon {
  color: #42b983;
}

/* Rest of the styles remain the same as in the previous submission */
/* Navigation bar */
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
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}


.bank-logo img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}
.navbar .logo {
  color: white;
  font-size: 1.8rem;
  margin: 0;
  font-weight: bold;
}

.navbar ul {
  display: flex;
  list-style: none;
  gap: 20px;
  margin: 0;
  padding: 0;
}

.navbar li {
  margin-left: 1.5rem;
}

.navbar a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
  opacity: 0.9;
}

.navbar a:hover {
  opacity: 1;
}

.navbar li.active a {
  font-weight: 700;
  opacity: 1;
}

/* Contact page base styles */
.contact-page {
  min-height: 100vh;
  background-color: #f8faf8;
  display: flex;
  flex-direction: column;
}

.contact-container {
  position: relative;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 20px;
  flex: 1;
}

/* Decorative shape with subtle animation */
.decorative-shape {
  position: absolute;
  top: 60px;
  right: 5%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(90, 184, 138, 0.1), rgba(90, 184, 138, 0.05));
  z-index: -1;
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Header styles */
.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #42b983;
  font-size: 2.2rem;
  margin-bottom: 10px;
  font-weight: 600;
}

.subtitle {
  color: #4a5568;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}

/* Form styles */
.contact-form {
  display: grid;
  gap: 20px;
}

.form-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.form-card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
}

.section-title {
  color: #42b983;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 500;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.required {
  color: #e53935;
  margin-left: 3px;
}

/* Input and textarea styles */
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 14px 16px 14px 40px;
  font-size: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;
  color: #333;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-group input:focus,
.form-group textarea:focus,
.input-focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.15);
}

/* Submit button */
.submit-btn {
  height: 50px;
  padding: 0 30px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 200px;
  box-shadow: 0 2px 4px rgba(66, 185, 131, 0.2);
}

.submit-btn:hover {
  background-color: #3aa876;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.3);
}

.submit-btn:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Contact info cards */
.contact-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
  margin-bottom: 40px;
}

.info-card {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.info-icon {
  width: 50px;
  height: 50px;
  background-color: rgba(66, 185, 131, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
}

.info-icon svg {
  color: #42b983;
}

.info-card h3 {
  color: #2c3e50;
  margin: 0 0 10px;
  font-size: 1.1rem;
}

.info-card p {
  color: #4a5568;
  margin: 0;
}

/* Footer */
.site-footer {
  background-color: #42b983;
  color: white;
  padding: 14px;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  padding: 0 20px;
}

.footer-links {
  margin-bottom: 1rem;
}

.footer-links a {
  color: white;
  margin: 0 1rem;
  text-decoration: none;
  opacity: 0.9;
}

.footer-links a:hover {
  opacity: 1;
  text-decoration: underline;
}

.copyright {
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .contact-info {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .navbar {
    flex-direction: column;
    padding: 10px;
  }

  .navbar ul {
    margin-top: 10px;
  }

  .decorative-shape {
    width: 200px;
    height: 200px;
    top: 40px;
    right: 0;
    opacity: 0.5;
  }
}

@media (max-width: 480px) {
  .contact-page {
    padding: 0;
  }

  .contact-container {
    padding: 20px 10px;
  }

  .submit-btn {
    width: 100%;
  }

  .navbar ul {
    font-size: 0.9rem;
  }

  .navbar li {
    margin-left: 0.7rem;
  }

  .footer-links a {
    display: block;
    margin: 0.5rem 0;
  }
}
</style>