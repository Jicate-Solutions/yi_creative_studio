# Creative Details Fields Reference

> Yi CreativeStudio - Comprehensive Field Documentation for Brainstorming

---

## Table of Contents

1. [Field Categories](#field-categories)
2. [Canonical Field Registry](#canonical-field-registry)
3. [Fields by Creative Format](#fields-by-creative-format)
4. [Vertical-Specific Fields](#vertical-specific-fields)
5. [Field Aliases](#field-aliases)
6. [Potentially Missing Fields](#potentially-missing-fields)

---

## Field Categories

| Category | Description | Form Section |
|----------|-------------|--------------|
| `core` | Required event/content details | Event Details |
| `content` | Main content and descriptions | Content |
| `speaker` | Speaker/presenter information | Speaker Details |
| `contact` | Contact and registration details | Contact & Registration |
| `signatory` | Certificate signatories | Signatories |
| `social` | Social media fields | Social Media |
| `branding` | Organization/company branding | Branding |
| `media` | Video/channel specific fields | Video & Channel |
| `advanced` | Additional details and notes | Advanced Options |

---

## Canonical Field Registry

### Core Content Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `eventName` | Event Name | text | 180 | Yes | Yes |
| `eventTagline` | Tagline / Subtitle | text | 150 | - | Yes |
| `eventDescription` | Description | textarea | 450 | - | Yes |
| `eventDate` | Event Date | date | - | Yes | - |
| `eventTime` | Event Time | time | - | - | - |
| `venue` | Venue | text | 225 | Yes | - |

### Speaker Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `speakerName` | Speaker Name | text | 150 | - | - |
| `speakerDesignation` | Designation / Title | text | 150 | - | - |

### Contact Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `contactNumber` | Contact Number | text | 45 | - | - |
| `contactEmail` | Email Address | text | 75 | - | - |
| `registrationInfo` | Registration Info | text | 180 | - | Yes |
| `websiteUrl` | Website / Link | text | 225 | - | - |
| `contactInfo` | Contact Information | text | 150 | - | - |

### Certificate & Signatory Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `recipientName` | Recipient Name | text | 90 | Yes | - |
| `certificateTitle` | Certificate Title | text | 90 | Yes | Yes |
| `achievementDescription` | Achievement Description | textarea | 300 | Yes | Yes |
| `certificateStyle` | Certificate Style | select | - | - | - |
| `issuingAuthority` | Issuing Authority | text | 120 | Yes | - |
| `signatoryName` | Signatory Name | text | 90 | - | - |
| `signatoryDesignation` | Signatory Title | text | 90 | - | - |
| `signatoryName2` | Second Signatory Name | text | 90 | - | - |
| `signatoryDesignation2` | Second Signatory Title | text | 90 | - | - |
| `certificateNumber` | Certificate Number | text | 45 | - | - |

### Social Media Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `postCaption` | Caption | textarea | 450 | Yes | Yes |
| `postTitle` | Post Title | text | 150 | Yes | Yes |
| `hashtags` | Hashtags | text | 225 | - | Yes |
| `callToAction` | Call to Action | text | 75 | - | Yes |
| `supportingText` | Supporting Text | text | 120 | - | Yes |

### Branding Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `organizationName` | Organization Name | text | 90 | - | - |
| `companyAddress` | Address | text | 180 | - | - |
| `socialHandle` | Social Handle | text | 60 | - | - |

### Media / Video Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `videoTitle` | Video Title | text | 120 | Yes | Yes |
| `hookText` | Hook/Teaser Text | text | 60 | - | Yes |
| `channelName` | Channel Name | text | 90 | - | - |
| `uploadSchedule` | Upload Schedule | text | 75 | - | - |
| `episodeNumber` | Episode Number | text | 30 | - | - |

### Marketing Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `valueProposition` | Value Proposition | text | 90 | - | Yes |
| `offerDetails` | Offer Details | text | 60 | - | Yes |
| `keyPoints` | Key Points | textarea | 450 | - | Yes |

### Event-Specific Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `targetAudience` | Target Audience | select | - | - | - |
| `dressCode` | Dress Code | text | 60 | - | - |
| `specialInstructions` | Special Instructions | textarea | 225 | - | Yes |

### Document Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `personName` | Full Name | text | 75 | Yes | - |
| `jobTitle` | Job Title | text | 90 | - | - |
| `professionalSummary` | Professional Summary | textarea | 450 | - | Yes |
| `reportTitle` | Report Title | text | 150 | Yes | Yes |
| `authorName` | Author Name | text | 90 | - | - |
| `reportPeriod` | Report Period | text | 60 | - | - |
| `bookTitle` | Book Title | text | 120 | Yes | Yes |
| `presentationTitle` | Presentation Title | text | 120 | Yes | Yes |

### Advanced / Global Fields

| Field ID | Label | Type | Max | Required | Suggestable |
|----------|-------|------|-----|----------|-------------|
| `additionalDetails` | Additional Details | textarea | 500 | - | Yes |

---

## Fields by Creative Format

### Event Formats

#### Event Poster (`event_poster`)

| Section | Fields |
|---------|--------|
| Core | `eventName`, `eventTagline`, `eventDescription`, `eventDate`, `eventTime`, `venue` |
| Speaker | `speakerName`, `speakerDesignation` |
| Contact | `registrationInfo`, `contactNumber`, `websiteUrl`, `entryFee` |
| Branding | `organizationName` |
| Advanced | `targetAudience`, `additionalDetails` |

#### Portrait Poster (`portrait_poster`)

| Section | Fields |
|---------|--------|
| Core | `eventName`, `eventTagline`, `eventDate`, `eventTime`, `venue` |
| Speaker | `speakerName`, `speakerDesignation` |
| Contact | `contactInfo` |
| Advanced | `additionalDetails` |

#### Landscape Poster (`landscape_poster`)

Same fields as Portrait Poster.

#### Announcement (`announcement`)

| Section | Fields |
|---------|--------|
| Core | `eventName`, `eventDate` |
| Content | `postCaption` |
| Contact | `registrationInfo` |
| Advanced | `callToAction`, `additionalDetails` |

#### Invitation (`invitation`)

| Section | Fields |
|---------|--------|
| Core | `eventName`, `eventDate`, `eventTime`, `venue` |
| Speaker | `speakerName`, `speakerDesignation` |
| Contact | `registrationInfo`, `dressCode` |
| Advanced | `specialInstructions`, `additionalDetails` |

---

### Social Media Formats

#### Instagram Post (`instagram_post`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `postCaption` |
| Social | `callToAction`, `hashtags` |
| Advanced | `additionalDetails` |

#### Instagram Story (`instagram_story`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `supportingText` |
| Social | `callToAction`, `hashtags` |
| Advanced | `additionalDetails` |

#### Instagram Reel (`instagram_reel`)

Same fields as Instagram Story.

#### Facebook Post (`facebook_post`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `postCaption` |
| Social | `callToAction`, `websiteUrl` |
| Advanced | `additionalDetails` |

#### Facebook Cover (`facebook_cover`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `eventTagline` |
| Social | `callToAction` |
| Advanced | `additionalDetails` |

#### Facebook Ad (`facebook_ad`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `valueProposition` |
| Social | `callToAction` |
| Advanced | `additionalDetails` |

#### LinkedIn Post (`linkedin_post`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `postCaption` |
| Social | `callToAction`, `supportingText` |
| Advanced | `additionalDetails` |

#### LinkedIn Banner (`linkedin_banner`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `eventTagline` |
| Advanced | `additionalDetails` |

#### Twitter Post (`twitter_post`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `supportingText` |
| Social | `hashtags` |
| Advanced | `additionalDetails` |

#### Twitter Header (`twitter_header`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `eventTagline` |
| Advanced | `additionalDetails` |

#### Pinterest Pin (`pinterest_pin`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `postCaption` |
| Social | `callToAction` |
| Advanced | `additionalDetails` |

#### TikTok Cover (`tiktok_cover`)

Same fields as Instagram Story.

#### WhatsApp Status (`whatsapp_status`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `supportingText` |
| Social | `callToAction` |
| Advanced | `additionalDetails` |

---

### Video Formats

#### YouTube Thumbnail (`youtube_thumbnail`)

| Section | Fields |
|---------|--------|
| Core | `videoTitle`, `hookText` |
| Media | `channelName` |
| Advanced | `additionalDetails` |

#### YouTube Banner (`youtube_banner`)

| Section | Fields |
|---------|--------|
| Core | `eventTagline` |
| Media | `channelName`, `uploadSchedule` |
| Advanced | `additionalDetails` |

#### Video Cover (`video_cover`)

| Section | Fields |
|---------|--------|
| Core | `videoTitle`, `eventTagline` |
| Media | `episodeNumber` |
| Speaker | `speakerName`, `speakerDesignation` |
| Advanced | `additionalDetails` |

---

### Print Formats

#### Certificate (`certificate`)

| Section | Fields |
|---------|--------|
| Core | `certificateTitle`, `recipientName`, `achievementDescription`, `eventDate` |
| Signatory | `issuingAuthority`, `signatoryName`, `signatoryDesignation`, `signatoryName2`, `signatoryDesignation2` |
| Advanced | `certificateStyle`, `certificateNumber`, `additionalDetails` |

#### Flyer A4 (`flyer_a4`)

| Section | Fields |
|---------|--------|
| Core | `eventName`, `eventDate`, `eventTime`, `venue` |
| Content | `eventDescription` |
| Speaker | `speakerName`, `speakerDesignation` |
| Contact | `contactNumber`, `contactEmail`, `websiteUrl` |
| Advanced | `callToAction`, `additionalDetails` |

#### Flyer A5 (`flyer_a5`)

Same fields as Flyer A4.

#### Brochure (`brochure`)

| Section | Fields |
|---------|--------|
| Core | `eventName` |
| Content | `eventDescription`, `keyPoints` |
| Contact | `contactInfo` |
| Advanced | `callToAction`, `additionalDetails` |

#### Business Card (`business_card`)

| Section | Fields |
|---------|--------|
| Core | `personName`, `jobTitle` |
| Contact | `contactNumber`, `contactEmail`, `websiteUrl` |
| Branding | `organizationName`, `socialHandle` |
| Advanced | `additionalDetails` |

---

### Marketing Formats

#### Web Banner (`web_banner`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `valueProposition` |
| Content | `offerDetails` |
| Social | `callToAction` |
| Advanced | `additionalDetails` |

#### Email Header (`email_header`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `eventTagline` |
| Advanced | `additionalDetails` |

#### Billboard (`billboard`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `eventTagline` |
| Social | `callToAction` |
| Contact | `contactInfo` |
| Advanced | `additionalDetails` |

#### Leaderboard Ad (`leaderboard_ad`)

| Section | Fields |
|---------|--------|
| Core | `postTitle` |
| Social | `callToAction` |
| Advanced | `offerDetails`, `additionalDetails` |

#### Square Ad (`square_ad`)

| Section | Fields |
|---------|--------|
| Core | `postTitle`, `valueProposition` |
| Social | `callToAction` |
| Advanced | `additionalDetails` |

---

### Document Formats

#### Letterhead (`letterhead`)

| Section | Fields |
|---------|--------|
| Core | `organizationName` |
| Branding | `companyAddress`, `eventTagline` |
| Contact | `contactNumber`, `contactEmail`, `websiteUrl` |
| Advanced | `additionalDetails` |

#### Resume (`resume`)

| Section | Fields |
|---------|--------|
| Core | `personName`, `jobTitle` |
| Content | `professionalSummary` |
| Contact | `contactEmail`, `contactNumber`, `websiteUrl` |
| Advanced | `additionalDetails` |

#### Report Cover (`report_cover`)

| Section | Fields |
|---------|--------|
| Core | `reportTitle`, `eventTagline`, `eventDate` |
| Branding | `authorName`, `organizationName` |
| Advanced | `reportPeriod`, `additionalDetails` |

#### Book Cover (`book_cover`)

| Section | Fields |
|---------|--------|
| Core | `bookTitle`, `eventTagline` |
| Content | `authorName` |
| Advanced | `additionalDetails` |

---

### Presentation Formats

#### Presentation 16:9 (`presentation_16_9`)

| Section | Fields |
|---------|--------|
| Core | `presentationTitle`, `eventTagline`, `eventDate` |
| Speaker | `speakerName`, `speakerDesignation` |
| Advanced | `organizationName`, `additionalDetails` |

#### Presentation 4:3 (`presentation_4_3`)

Same fields as Presentation 16:9.

---

## Vertical-Specific Fields

### Masoom (Child Safety)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `targetAgeGroup` | Target Age Group | select | Children (5-10), Tweens (11-14), Parents, Teachers |
| `safetyMessage` | Safety Message | text | - |
| `parentGuidance` | Parent Guidance | text | - |

### Road Safety (Traffic & Driving)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `safetyStatistic` | Safety Statistic | text | - |
| `safetyPledge` | Safety Pledge | text | - |
| `targetAudience` | Target Audience | select | Drivers, Pedestrians, Students, General Public |

### Health (Health & Wellness)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `healthTopic` | Health Topic | text | - |
| `medicalPartner` | Medical Partner | text | - |
| `healthBenefit` | Health Benefit | text | - |

### Yuva (Youth)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `skillFocus` | Skill Focus | text | - |
| `careerBenefit` | Career Benefit | text | - |
| `targetAge` | Target Age | select | 18-22, 23-28, 29-35 |

### Climate Change (Environment)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `environmentalImpact` | Environmental Impact | text | - |
| `greenPledge` | Green Pledge | text | - |
| `sustainabilityGoal` | Sustainability Goal | text | - |

### Innovation (Technology)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `technologyFocus` | Technology Focus | text | - |
| `innovationTheme` | Innovation Theme | text | - |
| `techPartner` | Technology Partner | text | - |

### Thalir (Culture)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `culturalTheme` | Cultural Theme | text | - |
| `festivalName` | Festival/Event Name | text | - |

### Chapter Events (General)

| Field ID | Label | Type | Options |
|----------|-------|------|---------|
| `chapterName` | Chapter Name | text | - |
| `eventCategory` | Event Category | select | General Meeting, Conference, Celebration, Training, Networking |

---

## Field Aliases

Legacy field IDs that map to canonical IDs:

| Canonical ID | Aliases |
|--------------|---------|
| `eventName` | eventTitle, title, posterTitle, announcementTitle, flyerTitle, brochureTitle |
| `eventTagline` | subtitle, tagline, subheadline |
| `eventDescription` | description, flyerDescription, mainMessage |
| `eventDate` | date, certificateDate, postDate, importantDate, presentationDate, publicationDate, dateIssued |
| `eventTime` | time, startTime |
| `venue` | eventVenue, location |
| `speakerName` | speaker, guestSpeaker, presenterName, hostName |
| `speakerDesignation` | presenterTitle |
| `contactNumber` | phoneNumber, contactPhone |
| `contactEmail` | emailAddress, email |
| `registrationInfo` | rsvpInfo |
| `websiteUrl` | website, linkText, linkedinUrl |
| `recipientName` | recipient |
| `certificateStyle` | style |
| `postCaption` | postDescription, professionalMessage, tweetText, statusMessage, announcementMessage |
| `postTitle` | headline, storyHeadline, pinTitle, coverTitle, bannerTitle, headerTitle, adHeadline |
| `callToAction` | actionRequired |
| `supportingText` | supportingMessage, briefDescription, keyInsight |
| `organizationName` | companyName, organizedBy, chapterName |
| `offerDetails` | offerText, entryFee |
| `additionalDetails` | eventNote, additionalNote, notes |

---

## Comprehensive Missing Fields (97 Fields Identified)

### 1. EVENT & SCHEDULING Fields (10 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `endDate` | End Date | date | - | core | Multi-day events, conferences |
| `endTime` | End Time | time | - | core | Event duration display |
| `eventDuration` | Duration | text | 30 | core | "2 hours", "3 days" |
| `timezone` | Timezone | select | - | core | Virtual/hybrid events |
| `deadlineDate` | Registration Deadline | date | - | contact | Early bird, last date |
| `countdownTarget` | Countdown To | text | 60 | advanced | "Days until event" |
| `recurringSchedule` | Recurring | text | 90 | advanced | "Every Saturday", "Monthly" |
| `eventPhase` | Event Phase | select | - | advanced | Pre-event, Live, Post-event |
| `dayNumber` | Day Number | text | 20 | core | "Day 1 of 3", "Session 2" |
| `sessionTime` | Session Timing | text | 60 | core | "Morning Session: 9AM-12PM" |

### 2. PEOPLE & CREDITS Fields (17 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `speaker2Name` | Second Speaker | text | 150 | speaker | Panel discussions |
| `speaker2Designation` | Second Speaker Title | text | 150 | speaker | Multiple speakers |
| `speaker3Name` | Third Speaker | text | 150 | speaker | Panel of 3+ |
| `speaker3Designation` | Third Speaker Title | text | 150 | speaker | Panel credentials |
| `moderatorName` | Moderator | text | 120 | speaker | Panel moderator |
| `moderatorDesignation` | Moderator Title | text | 120 | speaker | Panel moderator role |
| `panelistNames` | Panelists | textarea | 300 | speaker | "Name1, Name2, Name3" |
| `sponsorName` | Primary Sponsor | text | 120 | branding | Main sponsor |
| `sponsorList` | All Sponsors | textarea | 300 | branding | Multiple sponsors |
| `partnerName` | Partner Organization | text | 120 | branding | Co-organizer |
| `partnerList` | All Partners | textarea | 300 | branding | Multiple partners |
| `poweredBy` | Powered By | text | 90 | branding | Tech/platform sponsor |
| `presentedBy` | Presented By | text | 90 | branding | Presenting sponsor |
| `supportedBy` | Supported By | text | 150 | branding | Supporting orgs |
| `photographerCredit` | Photo Credit | text | 90 | advanced | Image attribution |
| `designCredit` | Design Credit | text | 90 | advanced | Designer attribution |
| `collaboratorHandle` | Collaborator | text | 60 | social | @collab handle |

### 3. ENGAGEMENT & SOCIAL Fields (14 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `mentionHandles` | Mention Handles | text | 180 | social | "@yi @cii @partner" |
| `taggedAccounts` | Tagged Accounts | text | 180 | social | Accounts to tag |
| `communityLink` | Community Link | text | 225 | social | Discord, Slack, WhatsApp group |
| `pollQuestion` | Poll Question | text | 120 | social | Engagement poll |
| `pollOptions` | Poll Options | textarea | 225 | social | "Option 1, Option 2, Option 3" |
| `engagementCta` | Engagement CTA | text | 90 | social | "Comment below", "Share your story" |
| `testimonialQuote` | Testimonial | textarea | 300 | content | Participant quote |
| `testimonialAuthor` | Testimonial By | text | 90 | content | Quote attribution |
| `impactNumber` | Impact Number | text | 30 | content | "500+ Attendees", "10K Views" |
| `impactLabel` | Impact Label | text | 60 | content | What the number means |
| `socialProof` | Social Proof | text | 120 | content | "Trusted by 100+ companies" |
| `communitySize` | Community Size | text | 60 | content | "Join 5000+ members" |
| `shareMessage` | Share Text | textarea | 280 | social | Pre-written share text |
| `eventHashtag` | Event Hashtag | text | 60 | social | Primary hashtag "#YiSummit2025" |

### 4. MEDIA & RICH CONTENT Fields (16 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `qrCodeUrl` | QR Code URL | text | 225 | media | Registration/info link |
| `qrCodeLabel` | QR Code Label | text | 45 | media | "Scan to Register" |
| `videoUrl` | Video Link | text | 225 | media | YouTube/Vimeo embed |
| `liveStreamUrl` | Live Stream | text | 225 | media | Live event link |
| `podcastUrl` | Podcast Link | text | 225 | media | Audio content |
| `playlistUrl` | Playlist Link | text | 225 | media | Music/video playlist |
| `galleryCount` | Photo Count | text | 20 | media | "50+ Photos" |
| `downloadUrl` | Download Link | text | 225 | media | Resources/materials |
| `resourceName` | Resource Name | text | 90 | media | "Event Brochure PDF" |
| `mapEmbedUrl` | Map Link | text | 225 | contact | Google Maps embed |
| `virtualMeetingUrl` | Meeting Link | text | 225 | contact | Zoom/Teams/Meet |
| `meetingId` | Meeting ID | text | 45 | contact | Virtual meeting ID |
| `meetingPasscode` | Meeting Passcode | text | 30 | contact | Virtual meeting password |
| `appStoreUrl` | App Store Link | text | 225 | media | iOS app link |
| `playStoreUrl` | Play Store Link | text | 225 | media | Android app link |
| `arFilterUrl` | AR Filter Link | text | 225 | media | Instagram/Snapchat filter |

### 5. CERTIFICATE-SPECIFIC Fields (10 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `courseName` | Course Name | text | 120 | core | Training certificates |
| `courseCode` | Course Code | text | 30 | advanced | "CERT-AI-101" |
| `completionDate` | Completion Date | date | - | core | When completed |
| `validUntil` | Valid Until | date | - | advanced | Certification expiry |
| `gradeScore` | Grade/Score | text | 30 | advanced | "A+", "95%", "Distinction" |
| `creditsEarned` | Credits Earned | text | 30 | advanced | "3 CPD Credits" |
| `verificationUrl` | Verification Link | text | 225 | advanced | Online verification |
| `badgeUrl` | Digital Badge | text | 225 | advanced | Credly/badge link |
| `signatoryName3` | Third Signatory Name | text | 90 | signatory | 3-signatory certs |
| `signatoryDesignation3` | Third Signatory Title | text | 90 | signatory | 3-signatory certs |

### 6. BUSINESS & PROFESSIONAL Fields (10 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `linkedinProfileUrl` | LinkedIn Profile | text | 225 | contact | Business cards/resume |
| `twitterHandle` | Twitter/X Handle | text | 60 | social | @handle |
| `instagramHandle` | Instagram Handle | text | 60 | social | @handle |
| `githubUrl` | GitHub Profile | text | 225 | contact | Tech professionals |
| `portfolioUrl` | Portfolio Link | text | 225 | contact | Creative professionals |
| `calendarBookingUrl` | Book a Meeting | text | 225 | contact | Calendly/Cal.com |
| `pronouns` | Pronouns | text | 30 | core | "He/Him", "She/Her" |
| `yearsExperience` | Years Experience | text | 20 | content | "15+ Years" |
| `certifications` | Certifications | text | 180 | content | "PMP, AWS, Scrum" |
| `languages` | Languages Spoken | text | 120 | content | "English, Hindi, Tamil" |

### 7. EVENT LOGISTICS Fields (10 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `parkingInfo` | Parking Info | text | 120 | contact | "Free parking available" |
| `transportInfo` | Transport Info | text | 150 | contact | Metro/bus directions |
| `foodInfo` | Food & Beverages | text | 90 | advanced | "Lunch included", "Vegetarian" |
| `accessibilityInfo` | Accessibility | text | 120 | advanced | Wheelchair, hearing loop |
| `materialsIncluded` | Materials Included | text | 150 | advanced | "Kit, Certificate, Lunch" |
| `whatToBring` | What to Bring | text | 150 | advanced | "Laptop, ID proof" |
| `covidPolicy` | Health Policy | text | 150 | advanced | Safety requirements |
| `ageRestriction` | Age Restriction | text | 45 | advanced | "18+ only", "All ages" |
| `seatingType` | Seating Type | select | - | advanced | Theater, Classroom, Round |
| `networkingTime` | Networking Time | text | 60 | advanced | "30 min networking break" |

### 8. PRICING & OFFERS Fields (10 fields)

| Field ID | Label | Type | Max | Category | Use Case |
|----------|-------|------|-----|----------|----------|
| `regularPrice` | Regular Price | text | 45 | contact | Full ticket price |
| `earlyBirdPrice` | Early Bird Price | text | 45 | contact | Discounted price |
| `earlyBirdDeadline` | Early Bird Until | date | - | contact | Discount deadline |
| `groupDiscount` | Group Discount | text | 60 | contact | "20% off for 5+" |
| `studentPrice` | Student Price | text | 45 | contact | Student discount |
| `memberPrice` | Member Price | text | 45 | contact | Yi member special |
| `promoCode` | Promo Code | text | 30 | contact | Discount code |
| `promoDiscount` | Promo Discount | text | 30 | contact | "Use YI25 for 25% off" |
| `refundPolicy` | Refund Policy | text | 120 | advanced | Cancellation terms |
| `paymentMethods` | Payment Methods | text | 120 | contact | "UPI, Card, Net Banking" |

---

## Summary: 97 Missing Fields by Category

| Category | Count | Priority |
|----------|-------|----------|
| Event & Scheduling | 10 | High |
| People & Credits | 17 | High |
| Engagement & Social | 14 | Medium |
| Media & Rich Content | 16 | Medium |
| Certificate-Specific | 10 | High |
| Business & Professional | 10 | Medium |
| Event Logistics | 10 | Low |
| Pricing & Offers | 10 | Medium |
| **TOTAL** | **97** | - |

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/config/field-registry.ts` | Canonical field definitions |
| `lib/schemas/formatFieldSchemas.ts` | Per-format field definitions |
| `lib/config/form-sections.ts` | Section organization |
| `lib/config/creative-formats.ts` | Format definitions |
| `lib/prompts/services/form-data-compiler.ts` | Field compilation |

---

*Last updated: December 2024*
