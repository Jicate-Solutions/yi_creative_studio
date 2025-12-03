🎨 Professional Design Recommendations for Yi CreativeStudio
Using Your Brand Colors & Canva-Style Implementation

1. FULL-WIDTH FORMAT SECTION LAYOUT
Current Issue:

The "Choose Format" section has limited width with sidebar taking up space
Format grid is constrained and doesn't maximize screen real estate

Recommended Approach (Canva-Style):
css/* Main content area */
.format-section {
  width: 100vw; /* Full viewport width */
  margin-left: calc(-50vw + 50%); /* Center and expand */
  padding: 32px 48px;
  background: linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%);
}

/* Format grid - expanded */
.format-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Collapsible sidebar option */
.sidebar-toggle {
  /* Allow collapsing sidebar to give format section more space */
  position: sticky;
  top: 16px;
}
Result: Format cards expand to fill available space, making selection more prominent and engaging.

2. GRADIENT BUTTON IMPLEMENTATION ⭐ PRIMARY FOCUS
Your Yi Brand Gradient Combinations:
css/* Primary Gradient - Blue to Teal */
.btn-primary-gradient {
  background: linear-gradient(135deg, #005B96 0%, #1B998B 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 300ms ease;
  box-shadow: 0 4px 12px rgba(0, 91, 150, 0.25);
}

.btn-primary-gradient:hover {
  background: linear-gradient(135deg, #004A7A 0%, #168B7F 100%);
  box-shadow: 0 6px 20px rgba(0, 91, 150, 0.35);
  transform: translateY(-2px);
}

.btn-primary-gradient:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 91, 150, 0.2);
}

/* Secondary Gradient - Orange to Blue */
.btn-secondary-gradient {
  background: linear-gradient(135deg, #FF6B35 0%, #005B96 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 300ms ease;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
}

.btn-secondary-gradient:hover {
  background: linear-gradient(135deg, #E85A28 0%, #004A7A 100%);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.35);
  transform: translateY(-2px);
}

/* Tertiary Gradient - Teal to Orange (Eye-catching) */
.btn-accent-gradient {
  background: linear-gradient(135deg, #1B998B 0%, #FF6B35 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 300ms ease;
  box-shadow: 0 4px 12px rgba(27, 153, 139, 0.25);
}

.btn-accent-gradient:hover {
  background: linear-gradient(135deg, #168B7F 0%, #E85A28 100%);
  box-shadow: 0 6px 20px rgba(27, 153, 139, 0.35);
  transform: translateY(-2px);
}
Apply to Your UI:
html<!-- "Continue" Button -->
<button class="btn-primary-gradient">Continue</button>

<!-- "Create New" Button (Sidebar) -->
<button class="btn-accent-gradient">+ Create New</button>

<!-- Format Selection Buttons -->
<button class="format-card btn-hover-gradient">
  Instagram Post
</button>

3. FORMAT CARD DESIGN (Canva-Style)
css/* Format cards with professional styling */
.format-card {
  background: white;
  border-radius: 12px;
  border: 2px solid transparent;
  padding: 16px;
  cursor: pointer;
  transition: all 300ms ease;
  position: relative;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* Gradient border effect */
.format-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #005B96, #1B998B, #FF6B35);
  border-radius: 12px;
  opacity: 0;
  transition: opacity 300ms ease;
  z-index: -1;
}

.format-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 91, 150, 0.2);
}

.format-card:hover::before {
  opacity: 1;
}

/* Selected state */
.format-card.selected {
  background: linear-gradient(135deg, rgba(0, 91, 150, 0.1), rgba(27, 153, 139, 0.1));
  border: 2px solid #005B96;
}

.format-card.selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #005B96, #1B998B);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.format-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 8px 0;
}

.format-card-size {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.format-card-badge {
  background: linear-gradient(135deg, #FF6B35, #FF8C54);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 8px;
  display: inline-block;
}

4. CATEGORY FILTER BUTTONS (Like Canva)
css/* Filter button group */
.filter-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 2px solid #E0E0E0;
  background: white;
  color: #1A1A2E;
  font-weight: 500;
  cursor: pointer;
  transition: all 300ms ease;
}

.filter-btn:hover {
  border-color: #005B96;
  color: #005B96;
  background: rgba(0, 91, 150, 0.05);
}

/* Active filter button */
.filter-btn.active {
  background: linear-gradient(135deg, #005B96, #1B998B);
  color: white;
  border: 2px solid transparent;
  box-shadow: 0 4px 12px rgba(0, 91, 150, 0.25);
}

5. SEARCH BAR ENHANCEMENT
css.search-input-wrapper {
  position: relative;
  margin-bottom: 24px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 300ms ease;
  background: white;
}

.search-input::placeholder {
  color: #999;
}

.search-input:focus {
  outline: none;
  border-color: #005B96;
  box-shadow: 0 0 0 3px rgba(0, 91, 150, 0.1);
  background: white;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #005B96;
  font-size: 16px;
}

6. SECTION HEADER STYLING
css.choose-format-header {
  margin-bottom: 32px;
}

.choose-format-title {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A2E;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #005B96 0%, #1B998B 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.choose-format-subtitle {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

7. RECENT FORMATS SECTION
css.recent-section {
  margin-bottom: 32px;
}

.recent-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-label::before {
  content: '🕒';
  font-size: 14px;
}

.recent-formats {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.recent-format-btn {
  padding: 8px 16px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  background: white;
  color: #1A1A2E;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 300ms ease;
}

.recent-format-btn:hover {
  background: linear-gradient(135deg, rgba(0, 91, 150, 0.1), rgba(27, 153, 139, 0.1));
  border-color: #005B96;
}

8. ACTION BUTTONS (Bottom)
css.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  border-top: 1px solid #E0E0E0;
  margin-top: 32px;
}

.btn-back {
  padding: 10px 16px;
  border: 2px solid #E0E0E0;
  background: white;
  color: #1A1A2E;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 300ms ease;
}

.btn-back:hover {
  border-color: #005B96;
  color: #005B96;
}

.step-counter {
  color: #999;
  font-size: 14px;
  font-weight: 500;
}

.btn-continue {
  background: linear-gradient(135deg, #005B96 0%, #1B998B 100%);
  color: white;
  padding: 12px 28px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 300ms ease;
  box-shadow: 0 4px 12px rgba(0, 91, 150, 0.25);
}

.btn-continue:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 91, 150, 0.35);
}

.btn-continue:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

9. COMPLETE HTML STRUCTURE EXAMPLE
html<!-- Format Selection Section -->
<section class="format-section">
  <div class="choose-format-header">
    <h1 class="choose-format-title">Choose Format</h1>
    <p class="choose-format-subtitle">Select the canvas size and format for your creative</p>
  </div>

  <!-- Search Bar -->
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input 
      type="text" 
      class="search-input" 
      placeholder="Search formats (e.g., Instagram, poster, YouTube...)"
    />
  </div>

  <!-- Recent Formats -->
  <div class="recent-section">
    <div class="recent-label">Recent</div>
    <div class="recent-formats">
      <button class="recent-format-btn">LinkedIn Post</button>
      <button class="recent-format-btn">Certificate</button>
      <button class="recent-format-btn">Video Cover</button>
    </div>
  </div>

  <!-- Category Filters -->
  <div class="filter-buttons">
    <button class="filter-btn active">All</button>
    <button class="filter-btn">Social Media</button>
    <button class="filter-btn">Video</button>
    <button class="filter-btn">Print</button>
    <button class="filter-btn">Presentations</button>
    <button class="filter-btn">Marketing</button>
    <button class="filter-btn">Documents</button>
  </div>

  <!-- Format Grid -->
  <div class="format-grid">
    <button class="format-card">
      <div class="format-card-title">Announcement</div>
      <div class="format-card-size">1080 x 810</div>
      <div class="format-card-badge">Popular</div>
    </button>
    
    <button class="format-card">
      <div class="format-card-title">Certificate</div>
      <div class="format-card-size">3508 x 2480</div>
      <div class="format-card-badge">Popular</div>
    </button>
    
    <!-- More format cards... -->
  </div>

  <!-- Action Buttons -->
  <div class="action-buttons">
    <button class="btn-back">← Back</button>
    <span class="step-counter">Step 0 of 6</span>
    <button class="btn-continue">Continue →</button>
  </div>
</section>

10. IMPLEMENTATION SUMMARY
ElementYi Brand Color UsedStylePrimary CTA ButtonBlue (#005B96) → Teal (#1B998B)GradientSecondary ButtonOrange (#FF6B35) → BlueGradientActive FilterBlue (#005B96)GradientFormat Card HoverBlue/Teal/OrangeMulti-color GradientBadgeOrange (#FF6B35)Solid with GradientSelected CardBlue (#005B96)Gradient BackgroundBorders (Hover)Blue (#005B96)SolidText PrimaryDark (#1A1A2E)SolidBackgroundLight (#F5F7FA)Gradient

Key Features to Implement:
✅ Full-width format section for immersive experience
✅ Gradient buttons using all 3 Yi brand colors
✅ Canva-style card design with smooth interactions
✅ Hover animations (lift effect, shadow elevation)
✅ Active state indicators with checkmark
✅ Smooth transitions (300ms ease)
✅ Professional spacing (8px grid system)
✅ Filter groups for better organization
✅ Search functionality with icon
✅ Mobile responsive grid layout