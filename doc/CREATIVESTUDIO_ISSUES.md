🎯 QUICK REFERENCE
IssueStatusEffortPriority#1: Dynamic Form FieldsOpen3-5 daysCRITICAL#2: Template FilteringOpen2-3 daysHIGH#3: Language ParameterOpen2-3 daysHIGH#4: Logo SizeOpen3-4 daysHIGH#5: Save TemplatesOpen5-7 daysHIGH#6: Download ParityOpen2-3 daysMEDIUM

ISSUE #1: DYNAMIC FORM FIELDS
Problem
Form fields are hardcoded for Event Details only regardless of creative type selected.
Current (Broken)
User selects "Certificate" → Shows Event Title, Event Date, Venue, Speaker
User selects "Social Media" → Shows Event Title, Event Date, Venue, Speaker (WRONG!)
Expected (Fixed)
User selects "Certificate" → Shows Certificate Name, Recipient, Date Issued, Authority
User selects "Social Media" → Shows Headline, Caption, CTA, Hashtags
Solution
File 1: lib/schemas/creativeSchemas.ts
typescriptexport const CREATIVE_SCHEMAS = {
  certificate: {
    type: 'certificate',
    displayName: 'Certificate',
    fields: [
      {
        id: 'certificateTitle',
        label: 'Certificate Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Achievement Certificate',
        maxLength: 100,
      },
      {
        id: 'achievementDescription',
        label: 'Achievement Description',
        type: 'textarea',
        required: true,
        placeholder: 'Describe what was achieved...',
        rows: 4,
      },
      {
        id: 'recipientName',
        label: 'Recipient Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., John Doe',
      },
      {
        id: 'dateIssued',
        label: 'Date Issued',
        type: 'date',
        required: true,
      },
      {
        id: 'issuingAuthority',
        label: 'Issuing Authority',
        type: 'text',
        required: true,
        placeholder: 'e.g., Yi Organization',
      },
      {
        id: 'certificateNumber',
        label: 'Certificate Number (Optional)',
        type: 'text',
        required: false,
      },
    ],
  },

  socialMediaPost: {
    type: 'socialMediaPost',
    displayName: 'Social Media Post',
    fields: [
      {
        id: 'postTitle',
        label: 'Post Title/Headline',
        type: 'text',
        required: true,
        placeholder: 'Create an engaging headline...',
        maxLength: 100,
      },
      {
        id: 'postDescription',
        label: 'Post Description/Caption',
        type: 'textarea',
        required: true,
        placeholder: 'Write your post content...',
        rows: 6,
      },
      {
        id: 'callToAction',
        label: 'Call-to-Action',
        type: 'text',
        required: false,
        placeholder: 'e.g., Learn More, Sign Up',
      },
      {
        id: 'targetAudience',
        label: 'Target Audience',
        type: 'text',
        required: false,
        placeholder: 'e.g., Students, Professionals',
      },
      {
        id: 'hashtags',
        label: 'Hashtags',
        type: 'text',
        required: false,
        placeholder: 'e.g., #YiOrg #Safety',
      },
    ],
  },

  emailHeader: {
    type: 'emailHeader',
    displayName: 'Email Header',
    fields: [
      {
        id: 'subjectLine',
        label: 'Subject Line',
        type: 'text',
        required: true,
        placeholder: 'Make it compelling...',
        maxLength: 60,
      },
      {
        id: 'previewText',
        label: 'Preview Text',
        type: 'text',
        required: false,
        placeholder: 'Text shown in email preview...',
        maxLength: 100,
      },
      {
        id: 'primaryCTA',
        label: 'Primary CTA Button Text',
        type: 'text',
        required: true,
        placeholder: 'e.g., Learn More',
      },
      {
        id: 'brandMessage',
        label: 'Brand Message',
        type: 'textarea',
        required: true,
        placeholder: 'Main email message...',
        rows: 5,
      },
    ],
  },

  blogPost: {
    type: 'blogPost',
    displayName: 'Blog Post',
    fields: [
      {
        id: 'articleTitle',
        label: 'Article Title',
        type: 'text',
        required: true,
        placeholder: 'Title for your blog post',
      },
      {
        id: 'articleSummary',
        label: 'Article Summary',
        type: 'textarea',
        required: true,
        placeholder: 'Brief summary...',
        rows: 4,
      },
      {
        id: 'authorName',
        label: 'Author Name',
        type: 'text',
        required: false,
      },
      {
        id: 'category',
        label: 'Category',
        type: 'text',
        required: false,
      },
    ],
  },

  marketingMaterial: {
    type: 'marketingMaterial',
    displayName: 'Marketing Material',
    fields: [
      {
        id: 'campaignName',
        label: 'Campaign Name',
        type: 'text',
        required: true,
      },
      {
        id: 'campaignMessage',
        label: 'Campaign Message',
        type: 'textarea',
        required: true,
        rows: 4,
      },
      {
        id: 'callToAction',
        label: 'Call-to-Action',
        type: 'text',
        required: true,
      },
      {
        id: 'offerDetails',
        label: 'Offer/Promotion Details',
        type: 'textarea',
        required: false,
        rows: 3,
      },
    ],
  },
};

export const getCreativeSchema = (creativeType: string) => {
  return CREATIVE_SCHEMAS[creativeType as keyof typeof CREATIVE_SCHEMAS] || null;
};
File 2: app/components/DynamicDetailsForm.tsx
typescript'use client';

import { useState } from 'react';
import { getCreativeSchema } from '@/lib/schemas/creativeSchemas';

interface Props {
  creativeType: string;
  onSubmit: (formData: Record<string, any>) => void;
}

export function DynamicDetailsForm({ creativeType, onSubmit }: Props) {
  const schema = getCreativeSchema(creativeType);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!schema) {
    return <div className="error">No schema found for creative type: {creativeType}</div>;
  }

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    schema.fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="dynamic-form">
      <h2>Fill in the details for your {schema.displayName}</h2>
      <p className="subtitle">Please provide the following information</p>
      
      {schema.fields.map(field => (
        <div key={field.id} className="form-group">
          <label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              maxLength={field.maxLength}
              required={field.required}
              className={errors[field.id] ? 'error' : ''}
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              rows={field.rows || 4}
              required={field.required}
              className={errors[field.id] ? 'error' : ''}
            />
          )}

          {field.type === 'date' && (
            <input
              id={field.id}
              type="date"
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              className={errors[field.id] ? 'error' : ''}
            />
          )}

          {field.type === 'select' && (
            <select
              id={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              className={errors[field.id] ? 'error' : ''}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}

          {errors[field.id] && (
            <span className="error-message">{errors[field.id]}</span>
          )}
        </div>
      ))}

      <button type="submit" className="btn-primary">
        Continue
      </button>
    </form>
  );
}
File 3: app/components/DetailsStep.tsx (UPDATE)
typescriptimport { DynamicDetailsForm } from '@/components/DynamicDetailsForm';
import { useCreativeContext } from '@/context/CreativeContext';

export function DetailsStep() {
  const { creativeType, updateDetails, navigateToNextStep } = useCreativeContext();

  const handleFormSubmit = (formData: Record<string, any>) => {
    updateDetails(formData);
    navigateToNextStep();
  };

  return (
    <div className="details-step">
      <DynamicDetailsForm 
        creativeType={creativeType}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
File 4: Database Migration
sql-- migration_001_add_details_type.sql
ALTER TABLE creative_details ADD COLUMN details_type VARCHAR(50) AFTER id;
ALTER TABLE creative_details ADD COLUMN field_mapping JSON AFTER details_type;
CREATE INDEX idx_details_type ON creative_details(details_type);
Testing Checklist

 Certificate form shows correct fields
 Social Media form shows correct fields
 Email Header form shows correct fields
 Form validation works
 Required fields are marked
 Error messages display
 Continue button submits data


ISSUE #2: TEMPLATE FILTERING BY VERTICAL
Problem
All templates displayed regardless of selected vertical.
Solution
File 1: lib/schemas/templateSchemas.ts
typescriptexport interface Template {
  id: string;
  name: string;
  format: string;
  vertical: string; // ← KEY FIELD
  thumbnail: string;
  description?: string;
}

export const TEMPLATE_METADATA: Template[] = [
  {
    id: 'health-cert-1',
    name: 'Yi Health 1',
    format: 'certificate',
    vertical: 'health',
    thumbnail: '/templates/health-1.jpg',
    description: 'Health certificate template'
  },
  {
    id: 'health-cert-2',
    name: 'Yi Health 2',
    format: 'certificate',
    vertical: 'health',
    thumbnail: '/templates/health-2.jpg',
  },
  {
    id: 'road-safety-cert-1',
    name: 'Yi Road Safety 1',
    format: 'certificate',
    vertical: 'road_safety',
    thumbnail: '/templates/road-safety-1.jpg',
  },
  // Add more templates...
];

export const getTemplatesByVertical = (
  vertical: string,
  format?: string
): Template[] => {
  return TEMPLATE_METADATA.filter(template => {
    if (template.vertical !== vertical) return false;
    if (format && template.format !== format) return false;
    return true;
  });
};
File 2: app/components/TemplateSelector.tsx (UPDATE)
typescript'use client';

import { useEffect, useState } from 'react';
import { getTemplatesByVertical } from '@/lib/schemas/templateSchemas';

interface Props {
  selectedVertical: string;
  selectedFormat: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelector({ 
  selectedVertical, 
  selectedFormat,
  onSelectTemplate 
}: Props) {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    // ✓ Filter templates by vertical and format
    const filteredTemplates = getTemplatesByVertical(
      selectedVertical,
      selectedFormat
    );
    setTemplates(filteredTemplates);
  }, [selectedVertical, selectedFormat]);

  return (
    <div className="template-selector">
      <h2>Choose Template for {selectedVertical}</h2>
      <p className="template-count">{templates.length} templates available</p>
      
      {templates.length === 0 ? (
        <div className="no-templates">
          <p>No templates available for {selectedVertical}</p>
          <p>You can start from scratch or choose another vertical</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map(template => (
            <div 
              key={template.id} 
              className="template-card"
              onClick={() => onSelectTemplate(template.id)}
            >
              <img src={template.thumbnail} alt={template.name} />
              <h3>{template.name}</h3>
              <p>{template.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
Database Migration
sql-- migration_002_add_template_vertical.sql
ALTER TABLE templates ADD COLUMN vertical VARCHAR(100);
UPDATE templates SET vertical = 'health' WHERE template_name LIKE '%Health%';
UPDATE templates SET vertical = 'road_safety' WHERE template_name LIKE '%Road Safety%';
CREATE INDEX idx_template_vertical ON templates(vertical);

ISSUE #3: LANGUAGE PARAMETER USAGE
Problem
Language field captured but NOT passed to AI generation.
Solution
File 1: lib/prompts/languageConfigs.ts
typescriptexport const LANGUAGE_CONFIGS = {
  English: {
    name: 'English',
    code: 'en',
    direction: 'ltr',
    fontFamily: 'Arial, Helvetica, sans-serif',
    instruction: 'Generate text in English'
  },
  Hindi: {
    name: 'Hindi',
    code: 'hi',
    direction: 'ltr',
    fontFamily: 'Devanagari, Noto Sans Devanagari, sans-serif',
    instruction: 'Generate text in Hindi using Devanagari script'
  },
  Spanish: {
    name: 'Spanish',
    code: 'es',
    direction: 'ltr',
    fontFamily: 'Arial, Helvetica, sans-serif',
    instruction: 'Generate text in Spanish with proper accents'
  },
  French: {
    name: 'French',
    code: 'fr',
    direction: 'ltr',
    fontFamily: 'Arial, Helvetica, sans-serif',
    instruction: 'Generate text in French with proper accents'
  },
  Arabic: {
    name: 'Arabic',
    code: 'ar',
    direction: 'rtl',
    fontFamily: 'Arabic Typesetting, Arial, sans-serif',
    instruction: 'Generate text in Arabic with RTL layout'
  },
  Japanese: {
    name: 'Japanese',
    code: 'ja',
    direction: 'ltr',
    fontFamily: 'Hiragino Sans, Meiryo, sans-serif',
    instruction: 'Generate text in Japanese (Hiragana, Katakana, Kanji)'
  },
};
File 2: lib/prompts/imagePrompts.ts
typescriptimport { LANGUAGE_CONFIGS } from './languageConfigs';

interface PromptData {
  format: string;
  vertical: string;
  language: string;
  title: string;
  date?: string;
  venue?: string;
  speaker?: string;
  [key: string]: any;
}

export function buildAIPrompt(data: PromptData): string {
  const langConfig = LANGUAGE_CONFIGS[data.language as keyof typeof LANGUAGE_CONFIGS] 
    || LANGUAGE_CONFIGS.English;
  
  return `
    Create a ${data.format} image for ${data.vertical} initiative
    
    Content Details:
    - Title: ${data.title}
    ${data.date ? `- Date: ${data.date}` : ''}
    ${data.venue ? `- Venue: ${data.venue}` : ''}
    ${data.speaker ? `- Speaker: ${data.speaker}` : ''}
    
    Language Requirements:
    - ${langConfig.instruction}
    - Language Code: ${langConfig.code}
    - Text Direction: ${langConfig.direction}
    - Use font: ${langConfig.fontFamily}
    
    Style:
    - Professional appearance
    - Clear, readable text
    - Yi organization branding
    - Appropriate imagery for ${data.vertical}
  `;
}
File 3: api/creative/generate.ts (UPDATE)
typescriptimport { buildAIPrompt } from '@/lib/prompts/imagePrompts';

export async function POST(request: Request) {
  const {
    format,
    vertical,
    template,
    detailsId,
    language  // ← NOW RECEIVED
  } = await request.json();

  try {
    // Get details
    const details = await db.creativeDetails.findById(detailsId);
    
    // ✓ Build prompt with language
    const prompt = buildAIPrompt({
      format,
      vertical,
      language,  // ← PASSED HERE
      title: details.title,
      date: details.date,
      venue: details.venue,
      speaker: details.speaker,
    });

    // Generate image
    const imageUrl = await aiImageService.generateImage(prompt, {
      language,  // ← PASSED TO SERVICE
      quality: 'hd'
    });

    return Response.json({
      success: true,
      image: imageUrl,
      metadata: { language, format, vertical }
    });

  } catch (error) {
    return Response.json({ error: 'Failed to generate' }, { status: 500 });
  }
}

ISSUE #4: LOGO SIZE SELECTION
Problem
No logo size selection field.
Solution
File 1: lib/constants/logoConstants.ts
typescriptexport const LOGO_SIZE_OPTIONS = {
  small: {
    label: 'Small',
    pixels: 80,
    maxWidth: '80px',
    useCase: 'Background logos, watermarks',
    opacity: 0.7
  },
  medium: {
    label: 'Medium',
    pixels: 150,
    maxWidth: '150px',
    useCase: 'Standard placement, balanced visibility',
    opacity: 1.0,
    default: true
  },
  large: {
    label: 'Large',
    pixels: 250,
    maxWidth: '250px',
    useCase: 'Prominent placement, high visibility',
    opacity: 1.0
  },
  custom: {
    label: 'Custom',
    pixels: null,
    maxWidth: null,
    useCase: 'User-defined sizing',
    minPixels: 40,
    maxPixels: 400
  }
};
File 2: app/components/LogoPlacement.tsx (UPDATE)
typescript'use client';

import { useState } from 'react';
import { LOGO_SIZE_OPTIONS } from '@/lib/constants/logoConstants';

export function LogoPlacement() {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [customSize, setCustomSize] = useState<number | null>(null);

  const currentSize = selectedSize === 'custom' 
    ? customSize 
    : LOGO_SIZE_OPTIONS[selectedSize as keyof typeof LOGO_SIZE_OPTIONS].pixels;

  return (
    <div className="logo-placement">
      <h3>Logo Size</h3>
      <p>Choose the size for your logos</p>

      <div className="size-options">
        {Object.entries(LOGO_SIZE_OPTIONS).map(([key, option]) => (
          <div key={key} className="size-option">
            <input
              type="radio"
              id={`size-${key}`}
              name="logoSize"
              value={key}
              checked={selectedSize === key}
              onChange={(e) => setSelectedSize(e.target.value)}
            />
            <label htmlFor={`size-${key}`}>
              <span className="size-label">{option.label}</span>
              <span className="size-pixels">({option.pixels}px)</span>
              <span className="size-usecase">{option.useCase}</span>
            </label>
          </div>
        ))}
      </div>

      {selectedSize === 'custom' && (
        <div className="custom-size-input">
          <label>Custom Size (px)</label>
          <input
            type="number"
            min="40"
            max="400"
            value={customSize || ''}
            onChange={(e) => setCustomSize(parseInt(e.target.value))}
            placeholder="Enter size between 40-400px"
          />
        </div>
      )}

      <div className="size-preview">
        <p>Preview:</p>
        <div 
          className="preview-box"
          style={{
            width: `${currentSize}px`,
            height: `${currentSize}px`,
            border: '2px dashed #ccc',
            borderRadius: '4px'
          }}
        >
          Logo
        </div>
      </div>
    </div>
  );
}

ISSUE #5: SAVE CREATIVES AS TEMPLATES
Problem
Users can't save their created creatives as reusable templates.
Solution
File 1: app/components/SaveTemplateDialog.tsx
typescript'use client';

import { useState } from 'react';

interface Props {
  creativeConfig: Record<string, any>;
  generatedImage: string;
  onClose: () => void;
  onSave: (template: any) => void;
}

export function SaveTemplateDialog({ 
  creativeConfig, 
  generatedImage, 
  onClose, 
  onSave 
}: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    tags: '',
    isPublic: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/templates/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          tags: formData.tags.split(',').map(t => t.trim()),
          isPublic: formData.isPublic,
          creativeConfig,
          previewImage: generatedImage
        })
      });

      const result = await response.json();
      onSave(result.template);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>Save as Template</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Template Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Road Safety Event Banner"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Describe what this template is for..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="">Select category</option>
              <option value="health">Health</option>
              <option value="road_safety">Road Safety</option>
              <option value="education">Education</option>
              <option value="climate">Climate Change</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g., safety, awareness, event"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
            />
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="public"
              checked={formData.isPublic}
              onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
            />
            <label htmlFor="public">Make this template public</label>
          </div>

          <div className="dialog-buttons">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Template'}
            </button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
File 2: Database Migration
sql-- migration_003_create_custom_templates.sql
CREATE TABLE custom_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  tags JSON,
  format_id VARCHAR(100),
  vertical VARCHAR(100),
  details_config JSON,
  logos_config JSON,
  language VARCHAR(50),
  thumbnail_url VARCHAR(500),
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_category (category)
);
File 3: api/templates/save.ts
typescriptexport async function POST(request: Request) {
  const {
    name,
    description,
    category,
    tags,
    isPublic,
    creativeConfig,
    previewImage
  } = await request.json();

  try {
    const userId = request.user.id; // From auth context

    const template = await db.customTemplates.create({
      userId,
      name,
      description,
      category,
      tags,
      isPublic,
      formatId: creativeConfig.format,
      vertical: creativeConfig.vertical,
      detailsConfig: creativeConfig.details,
      logosConfig: creativeConfig.logos,
      language: creativeConfig.language,
      thumbnailUrl: previewImage
    });

    return Response.json({ success: true, template });
  } catch (error) {
    return Response.json({ error: 'Failed to save template' }, { status: 500 });
  }
}

ISSUE #6: DOWNLOAD FUNCTIONALITY PARITY
Problem
Gallery has format options (PNG, JPEG, WebP) but Create page doesn't.
Solution
File 1: lib/components/DownloadButton.tsx
typescript'use client';

import { useState } from 'react';

const DOWNLOAD_FORMATS = {
  png: {
    label: 'PNG (High Quality)',
    description: 'Best for print and editing',
    mimeType: 'image/png',
    fileExtension: 'png',
    quality: 100
  },
  jpeg: {
    label: 'JPEG (Compressed)',
    description: 'Smaller file size for sharing',
    mimeType: 'image/jpeg',
    fileExtension: 'jpg',
    quality: 85
  },
  webp: {
    label: 'WebP (Web Optimized)',
    description: 'Fast loading, modern format',
    mimeType: 'image/webp',
    fileExtension: 'webp',
    quality: 80
  }
};

interface Props {
  imageUrl: string;
  fileName: string;
}

export function DownloadButton({ imageUrl, fileName }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (format: string) => {
    setDownloading(true);
    try {
      const response = await fetch('/api/creative/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          format,
          fileName,
          formatConfig: DOWNLOAD_FORMATS[format as keyof typeof DOWNLOAD_FORMATS]
        })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = DOWNLOAD_FORMATS[format as keyof typeof DOWNLOAD_FORMATS].fileExtension;
      link.download = `${fileName}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowMenu(false);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="download-container">
      <button 
        className="download-button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={downloading}
      >
        {downloading ? '⏳ Downloading...' : '⬇ Download'}
      </button>

      {showMenu && (
        <div className="download-menu">
          {Object.entries(DOWNLOAD_FORMATS).map(([key, format]) => (
            <button
              key={key}
              className="format-option"
              onClick={() => handleDownload(key)}
              disabled={downloading}
            >
              <div className="format-header">{format.label}</div>
              <div className="format-description">{format.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
File 2: api/creative/download.ts
typescriptimport sharp from 'sharp';

export async function POST(request: Request) {
  const { imageUrl, format, fileName, formatConfig } = await request.json();

  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();

    let output;
    
    switch (format) {
      case 'png':
        output = await sharp(buffer).png({ quality: 100 }).toBuffer();
        break;
      case 'jpeg':
        output = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
        break;
      case 'webp':
        output = await sharp(buffer).webp({ quality: 80 }).toBuffer();
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return new Response(output, {
      headers: {
        'Content-Type': formatConfig.mimeType,
        'Content-Disposition': `attachment; filename="${fileName}.${formatConfig.fileExtension}"`,
        'Content-Length': output.length.toString()
      }
    });

  } catch (error) {
    return Response.json({ error: 'Download failed' }, { status: 500 });
  }
}
```

---

## 🚀 CLAUDE CODE WORKFLOW

### How to Use This Document

**Step 1: Save to Documents**
```
Copy entire markdown → Save as: `/documents/CREATIVESTUDIO_ISSUES.md`
```

**Step 2: Open Claude Code**
```
Press: Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
Search: "Claude: Open Claude Code"
Click: "Open Claude Code Panel"
```

**Step 3: Ask Claude to Implement**
```
"Read CREATIVESTUDIO_ISSUES.md and implement ISSUE #1: Dynamic Form Fields"

Claude will:
✓ Read the document
✓ Create all files
✓ Update existing components
✓ Create database migration
✓ Provide implementation summary
```

**Step 4: Move to Next Issue**
```
"Move to ISSUE #2: Template Filtering by Vertical"
```

---

## ✅ COMPLETION CHECKLIST

### After Each Issue Implementation

- [ ] All files created/updated
- [ ] Database migrations applied
- [ ] No TypeScript errors
- [ ] Tests pass
- [ ] Feature works end-to-end
- [ ] Ready for next issue

---

**END OF DOCUMENT**

---

## HOW TO USE THIS IN YOUR PROJECT

1. **Copy this entire markdown text**
2. **Create file**: `/documents/CREATIVESTUDIO_ISSUES.md`
3. **Paste content** into the file
4. **In Claude Code**, ask:
```
   "Read CREATIVESTUDIO_ISSUES.md and implement Issue #1"
```
5. Claude will generate all code and make updates
6. After completion, ask:
```
   "Move to Issue #2"