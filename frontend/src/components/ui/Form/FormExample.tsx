import React, { useState } from 'react'
import {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadio,
  FormHelperText,
  FormErrorMessage,
} from './index'

/**
 * FormExample - Comprehensive example of brand-compliant form components
 *
 * Demonstrates all form components with proper brand styling,
 * accessibility features, and error states.
 *
 * Requirements: 4.2, 2.2, 1.3, 3.1, 3.2
 */
export const FormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    district: '',
    message: '',
    newsletter: false,
    role: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation for demonstration
    const newErrors: Record<string, string> = {}

    if (!formData['name'].trim()) {
      newErrors['name'] = 'Name is required'
    }

    if (!formData['email'].trim()) {
      newErrors['email'] = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData['email'])) {
      newErrors['email'] = 'Please enter a valid email address'
    }

    if (!formData['district']) {
      newErrors['district'] = 'Please select your district'
    }

    if (!formData['role']) {
      newErrors['role'] = 'Please select your role'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', formData)
      alert('Form submitted successfully!')
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 redesign-panel">
      <h2 className="tm-h2 mb-6">Contact Form Example</h2>
      <p className="tm-body-medium text-gray-600 mb-8">
        This form demonstrates all brand-compliant form components with proper
        typography, colors, and accessibility features.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Text Input */}
        <FormField error={!!errors['name']} required>
          <FormLabel htmlFor="name" required>
            Full Name
          </FormLabel>
          <FormInput
            id="name"
            type="text"
            value={formData['name']}
            onChange={e => handleInputChange('name', e.target.value)}
            error={!!errors['name']}
            placeholder="Enter your full name"
          />
          {errors['name'] && (
            <FormErrorMessage>{errors['name']}</FormErrorMessage>
          )}
          <FormHelperText>
            Please enter your first and last name as they appear on your
            membership.
          </FormHelperText>
        </FormField>

        {/* Email Input */}
        <FormField error={!!errors['email']} required>
          <FormLabel htmlFor="email" required>
            Email Address
          </FormLabel>
          <FormInput
            id="email"
            type="email"
            value={formData['email']}
            onChange={e => handleInputChange('email', e.target.value)}
            error={!!errors['email']}
            placeholder="your.email@example.com"
          />
          {errors['email'] && (
            <FormErrorMessage>{errors['email']}</FormErrorMessage>
          )}
        </FormField>

        {/* Select Dropdown */}
        <FormField error={!!errors['district']} required>
          <FormLabel htmlFor="district" required>
            District
          </FormLabel>
          <FormSelect
            id="district"
            value={formData['district']}
            onChange={e => handleInputChange('district', e.target.value)}
            error={!!errors['district']}
            placeholder="Select your district"
          >
            <option value="D1">District 1</option>
            <option value="D2">District 2</option>
            <option value="D3">District 3</option>
            <option value="D4">District 4</option>
            <option value="D5">District 5</option>
          </FormSelect>
          {errors['district'] && (
            <FormErrorMessage>{errors['district']}</FormErrorMessage>
          )}
        </FormField>

        {/* Textarea */}
        <FormField>
          <FormLabel htmlFor="message">Message</FormLabel>
          <FormTextarea
            id="message"
            value={formData['message']}
            onChange={e => handleInputChange('message', e.target.value)}
            placeholder="Tell us about your Toastmasters experience..."
            rows={4}
          />
          <FormHelperText>
            Optional: Share any additional information or questions you have.
          </FormHelperText>
        </FormField>

        {/* Radio Buttons */}
        <FormField error={!!errors['role']} required>
          <FormLabel required>Your Role in Toastmasters</FormLabel>
          <div className="space-y-3 mt-2">
            <FormRadio
              name="role"
              value="member"
              checked={formData['role'] === 'member'}
              onChange={e => handleInputChange('role', e.target.value)}
              label="Club Member"
              error={!!errors['role']}
            />
            <FormRadio
              name="role"
              value="officer"
              checked={formData['role'] === 'officer'}
              onChange={e => handleInputChange('role', e.target.value)}
              label="Club Officer"
              error={!!errors['role']}
            />
            <FormRadio
              name="role"
              value="area-director"
              checked={formData['role'] === 'area-director'}
              onChange={e => handleInputChange('role', e.target.value)}
              label="Area Director"
              error={!!errors['role']}
            />
            <FormRadio
              name="role"
              value="division-director"
              checked={formData['role'] === 'division-director'}
              onChange={e => handleInputChange('role', e.target.value)}
              label="Division Director"
              error={!!errors['role']}
            />
          </div>
          {errors['role'] && (
            <FormErrorMessage>{errors['role']}</FormErrorMessage>
          )}
        </FormField>

        {/* Checkbox */}
        <FormField>
          <FormCheckbox
            checked={formData['newsletter']}
            onChange={e => handleInputChange('newsletter', e.target.checked)}
            label="Subscribe to the Toastmasters newsletter for updates and tips"
          />
          <FormHelperText>
            You can unsubscribe at any time. We respect your privacy.
          </FormHelperText>
        </FormField>

        {/* Submit Button */}
        <div className="pt-4">
          <button type="submit" className="tm-btn-primary w-full sm:w-auto">
            Submit Form
          </button>
        </div>
      </form>
    </div>
  )
}
