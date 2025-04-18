<template>
  <div class="app-container">
    <!-- Hero Section with Parallax Effect -->
    <section class="about-hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title">About InQueue</h1>
        <p class="hero-subtitle">Revolutionizing the way you interact with banks.</p>
        <router-link to="/" class="home-button">Back to Home</router-link>
      </div>
    </section>

    <!-- Main Content Container -->
    <div class="about-container">
      <!-- Our Mission Section -->
      <section class="about-section mission-section">
        <div class="section-header">
          <h2>Our Mission</h2>
          <div class="accent-line"></div>
        </div>
        <div class="section-content">
          <div class="mission-card">
            <div class="mission-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p>
              At InQueue, we're dedicated to eliminating long wait times and streamlining the banking experience in Armenia.
              Developed as an initiative of the Central Bank of Armenia's Digitization and Development Department,
              our mission is to empower people with technology that makes banking appointments efficient,
              transparent, and hassle-free for all Armenians.
            </p>
          </div>
        </div>
      </section>

      <!-- Our Story Section with Timeline -->
      <section class="about-section story-section">
        <div class="section-header">
          <h2>Our Story</h2>
          <div class="accent-line"></div>
        </div>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-point"></div>
            <div class="timeline-content">
              <h3>March 2025</h3>
              <h4>The Beginning</h4>
              <p>
                InQueue was born as an initiative of the Central Bank of Armenia. Under the guidance of Aram Petrosyan,
                President of the Digitization and Development Department, the project was conceived to address the
                widespread problem of long wait times at Armenian banks.
              </p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-point"></div>
            <div class="timeline-content">
              <h3>March - April 2025</h3>
              <h4>Development Phase</h4>
              <p>
                Arsen Shaginian took the lead in developing the platform with technical support from the Central Bank team.
                The focus was on creating an intuitive interface that would make bank appointment scheduling accessible to everyone
                across Armenia.
              </p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-point"></div>
            <div class="timeline-content">
              <h3>May 2025</h3>
              <h4>Testing & Refinement</h4>
              <p>
                With the core functionality in place, we began extensive testing with partner banks. The valuable feedback
                from these institutions helped us refine the platform and ensure it would meet the needs of both customers
                and financial service providers.
              </p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-point"></div>
            <div class="timeline-content">
              <h3>May 2025</h3>
              <h4>Launch & Future Vision</h4>
              <p>
                After intensive development and testing, InQueue launched as a practical solution for the Armenian banking sector.
                With continued support from the Central Bank, we aim to expand the platform's capabilities and bring efficient
                appointment scheduling to all financial institutions across the country.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Team Section with Interactive Cards -->
      <section class="about-section team-section">
        <div class="section-header">
          <h2>Meet Our Team</h2>
          <div class="accent-line"></div>
        </div>
        <div class="team-grid">
          <div class="team-card" v-for="(member, index) in teamMembers" :key="index" @mouseover="member.isHovered = true" @mouseleave="member.isHovered = false">
            <div class="team-image-container">
              <div class="team-image" :style="{ backgroundImage: `url(${member.image})` }"></div>
              <div class="team-hover-content" :class="{ 'show': member.isHovered }">
                <p>{{ member.bio }}</p>
              </div>
            </div>
            <div class="team-info">
              <h3>{{ member.name }}</h3>
              <p class="team-role">{{ member.role }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Values Section -->
      <section class="about-section values-section">
        <div class="section-header">
          <h2>Our Values</h2>
          <div class="accent-line"></div>
        </div>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3>Trust</h3>
            <p>We build relationships on a foundation of transparency and reliability.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
            <h3>Excellence</h3>
            <p>We strive for the highest standards in everything we do.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3>Innovation</h3>
            <p>We embrace creative thinking to solve complex problems.</p>
          </div>
          <div class="value-card">
            <div class="value-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>Community</h3>
            <p>We believe in creating value for our users and partners.</p>
          </div>
        </div>
      </section>

      <!-- Contact CTA Section -->
      <section class="about-section contact-section">
        <div class="contact-card">
          <h2>Get in Touch</h2>
          <p>Have questions about InQueue? We'd love to hear from you!</p>
          <router-link to="/contactus" class="contact-button">Contact Us</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutUsPage',
  data() {
    return {
      teamMembers: [
        {
          name: 'Aram Petrosyan',
          role: 'Project Director',
          bio: 'President of Digitization and Development Department at the Central Bank of Armenia who initiated and oversees the InQueue project.',
          image: require('@/assets/logo.png'),
          isHovered: false
        },
        {
          name: 'Arsen Shaginian',
          role: 'Lead Developer',
          bio: 'Developed the core platform during his internship at the Central Bank of Armenia, bringing the vision to reality.',
          image: require('@/assets/logo.png'),
          isHovered: false
        },
        {
          name: 'Narek',
          role: 'JavaScript Developer',
          bio: 'Provided crucial JavaScript expertise and helped implement the core functionality of the InQueue platform.',
          image: require('@/assets/logo.png'),
          isHovered: false
        },
        {
          name: 'Arsen',
          role: 'Technical Consultant',
          bio: 'Offered technical assistance and problem-solving expertise throughout the development process.',
          image: require('@/assets/logo.png'),
          isHovered: false
        }
      ]
    };
  }
};
</script>

<style scoped>
.app-container {
  font-family: Arial, sans-serif;
  color: #2c3e50;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.about-hero {
  position: relative;
  height: 60vh;
  min-height: 400px;
  background-image: linear-gradient(to right, #42b983, #2d9664);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  margin-bottom: 60px;
}

.bank-logo img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}
.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(66, 185, 131, 0.9), rgba(45, 150, 100, 0.7));
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  padding: 0 20px;
}

.hero-title {
  font-size: 3.5rem;
  margin-bottom: 20px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  animation: fadeInDown 1s ease;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 30px;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease;
}

.about-section {
  margin-bottom: 80px;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
  font-weight: 600;
}

.accent-line {
  height: 4px;
  width: 60px;
  background: linear-gradient(to right, #42b983, #2d9664);
  margin: 0 auto;
  border-radius: 2px;
}

.mission-card {
  background-color: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  text-align: center;
  font-size: 1.2rem;
  line-height: 1.8;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mission-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.mission-icon {
  width: 80px;
  height: 80px;
  background-color: #e8f5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  color: #42b983;
}

.mission-icon svg {
  width: 40px;
  height: 40px;
}

/* Story Timeline Styles */
.timeline {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 4px;
  background: linear-gradient(to bottom, #42b983, #2d9664);
  transform: translateX(-50%);
  border-radius: 2px;
}

.timeline-item {
  position: relative;
  margin-bottom: 60px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.timeline-point {
  position: absolute;
  top: 0;
  left: 50%;
  width: 20px;
  height: 20px;
  background-color: #42b983;
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 1;
  box-shadow: 0 0 0 4px white, 0 0 0 6px rgba(66, 185, 131, 0.3);
}

.timeline-content {
  width: 45%;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.timeline-content:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.timeline-item:nth-child(odd) .timeline-content {
  margin-left: auto;
  transform: translateX(30px);
}

.timeline-item:nth-child(even) .timeline-content {
  margin-right: auto;
  transform: translateX(-30px);
}

.timeline-item:nth-child(odd) .timeline-content:hover {
  transform: translateX(30px) translateY(-5px);
}

.timeline-item:nth-child(even) .timeline-content:hover {
  transform: translateX(-30px) translateY(-5px);
}

.timeline-content h3 {
  font-size: 1.8rem;
  margin-bottom: 5px;
  color: #42b983;
}

.timeline-content h4 {
  font-size: 1.4rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.timeline-content p {
  font-size: 1.1rem;
  line-height: 1.6;
}

/* Team Section Styles */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

.team-card {
  background-color: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.team-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.team-image-container {
  position: relative;
  height: 280px;
  overflow: hidden;
}

.team-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: transform 0.4s ease;
}

.team-card:hover .team-image {
  transform: scale(1.1);
}

.team-hover-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(66, 185, 131, 0.9), rgba(45, 150, 100, 0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  text-align: center;
}

.team-hover-content.show {
  opacity: 1;
}

.team-hover-content p {
  font-size: 1rem;
  line-height: 1.6;
  text-align: center;
  margin: 0;
  padding: 0;
  width: 100%;
}

.team-info {
  padding: 20px;
  text-align: center;
}

.team-info h3 {
  margin-bottom: 5px;
  font-size: 1.4rem;
}

.team-role {
  color: #42b983;
  margin-bottom: 0;
  font-weight: 600;
}

/* Values Section Styles */
.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 30px;
}

.value-card {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.value-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
}

.value-icon {
  width: 60px;
  height: 60px;
  background-color: #e8f5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #42b983;
}

.value-icon svg {
  width: 30px;
  height: 30px;
}

.value-card h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #2c3e50;
}

.value-card p {
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
}

/* Contact Section Styles */
.contact-section {
  padding: 0;
}

.contact-card {
  background: linear-gradient(to right, #42b983, #2d9664);
  padding: 60px;
  border-radius: 10px;
  text-align: center;
  color: white;
  box-shadow: 0 15px 30px rgba(66, 185, 131, 0.2);
}

.contact-card h2 {
  font-size: 2.2rem;
  margin-bottom: 20px;
}

.contact-card p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.contact-button {
  display: inline-block;
  background-color: white;
  color: #42b983;
  padding: 15px 40px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.contact-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

/* Home Button Styles */
.home-button {
  display: inline-block;
  background-color: white;
  color: #42b983;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-top: 20px;
}

.home-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

/* Animations */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Design */
@media (max-width: 992px) {
  .timeline::before {
    left: 30px;
  }

  .timeline-item {
    justify-content: flex-start;
  }

  .timeline-point {
    left: 30px;
  }

  .timeline-content {
    width: calc(100% - 70px);
    margin-left: 70px !important;
    transform: none !important;
  }

  .timeline-item:nth-child(odd) .timeline-content:hover,
  .timeline-item:nth-child(even) .timeline-content:hover {
    transform: translateY(-5px) !important;
  }

  .hero-title {
    font-size: 3rem;
  }
}

@media (max-width: 768px) {
  .about-hero {
    height: 50vh;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .section-header h2 {
    font-size: 2rem;
  }

  .contact-card {
    padding: 40px 20px;
  }

  .values-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 576px) {
  .team-grid {
    grid-template-columns: 1fr;
  }

  .values-grid {
    grid-template-columns: 1fr;
  }

  .mission-card {
    padding: 30px 20px;
  }

  .contact-button {
    padding: 12px 30px;
  }
}
</style>