import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { AutocompleteInput, FormattedInput } from '../components/FormInputs';
import { PasswordInput } from '../components/PasswordInput';
import { validatePassword, PasswordValidation } from '../utils/passwordValidation';
import { 
  formatPhoneNumber, 
  formatSSN, 
  formatZipCode, 
  formatCurrency,
  US_STATES,
  MAJOR_CITIES,
  COUNTRIES,
  INDUSTRIES
} from '../utils/inputFormatting';

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  nationality: string;
  
  // Address Information
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  residenceType: 'owned' | 'rented' | 'family';
  yearsAtAddress: string;
  
  // Previous Address (if less than 2 years at current address)
  previousStreet: string;
  previousCity: string;
  previousState: string;
  previousZipCode: string;
  previousCountry: string;
  
  // Identity Information
  idType: 'passport' | 'driver_license' | 'national_id';
  idNumber: string;
  idIssueDate: string;
  idExpiryDate: string;
  ssn: string;
  
  // Employment Information
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'student' | 'retired';
  employerName: string;
  jobTitle: string;
  workPhoneNumber: string;
  monthlyIncome: string;
  employmentLength: string;
  industryType: string;
  
  // Financial Information
  sourceOfFunds: 'salary' | 'business' | 'investment' | 'inheritance' | 'other';
  estimatedMonthlyDeposits: string;
  estimatedMonthlyWithdrawals: string;
  hasOtherBankAccounts: boolean;
  otherBankDetails: string;
  hasCreditCards: boolean;
  hasLoans: boolean;
  loanDetails: string;
  
  // Legal and Compliance
  isPoliticallyExposed: boolean;
  politicalExposureDetails: string;
  isTaxResident: boolean;
  taxResidentCountries: string;
  hasConvictions: boolean;
  convictionDetails: string;
  
  // Banking Preferences
  accountType: 'checking' | 'savings' | 'business';
  initialDepositAmount: string;
  preferredLanguage: string;
  communicationPreference: 'email' | 'sms' | 'mail' | 'phone';
  
  // References
  reference1Name: string;
  reference1Phone: string;
  reference1Relationship: string;
  reference2Name: string;
  reference2Phone: string;
  reference2Relationship: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  emergencyContactAddress: string;
  
  // Agreement and Declarations
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
  agreeToMarketingCommunications: boolean;
  confirmInformationAccuracy: boolean;
}

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    dateOfBirth: '',
    gender: 'male',
    maritalStatus: 'single',
    nationality: 'United States',
    
    // Address Information
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    residenceType: 'owned',
    yearsAtAddress: '',
    
    // Previous Address
    previousStreet: '',
    previousCity: '',
    previousState: '',
    previousZipCode: '',
    previousCountry: '',
    
    // Identity Information
    idType: 'driver_license',
    idNumber: '',
    idIssueDate: '',
    idExpiryDate: '',
    ssn: '',
    
    // Employment Information
    employmentStatus: 'employed',
    employerName: '',
    jobTitle: '',
    workPhoneNumber: '',
    monthlyIncome: '',
    employmentLength: '',
    industryType: '',
    
    // Financial Information
    sourceOfFunds: 'salary',
    estimatedMonthlyDeposits: '',
    estimatedMonthlyWithdrawals: '',
    hasOtherBankAccounts: false,
    otherBankDetails: '',
    hasCreditCards: false,
    hasLoans: false,
    loanDetails: '',
    
    // Legal and Compliance
    isPoliticallyExposed: false,
    politicalExposureDetails: '',
    isTaxResident: true,
    taxResidentCountries: '',
    hasConvictions: false,
    convictionDetails: '',
    
    // Banking Preferences
    accountType: 'checking',
    initialDepositAmount: '',
    preferredLanguage: 'English',
    communicationPreference: 'email',
    
    // References
    reference1Name: '',
    reference1Phone: '',
    reference1Relationship: '',
    reference2Name: '',
    reference2Phone: '',
    reference2Relationship: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    emergencyContactAddress: '',
    
    // Agreement and Declarations
    agreeToTerms: false,
    agreeToPrivacyPolicy: false,
    agreeToMarketingCommunications: false,
    confirmInformationAccuracy: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({ 
    isValid: false, 
    errors: [], 
    strength: 'weak' 
  });
  
  const { register, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handler for formatted inputs
  const handleFormattedChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      // Personal Information Validation
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const validation = validatePassword(formData.password);
        if (!validation.isValid) {
          newErrors.password = 'Password does not meet requirements';
        }
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.nationality.trim()) newErrors.nationality = 'Nationality is required';
    }

    if (step === 2) {
      // Address Information Validation
      if (!formData.street.trim()) newErrors.street = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
      if (!formData.yearsAtAddress.trim()) newErrors.yearsAtAddress = 'Years at address is required';
    }

    if (step === 3) {
      // Identity & Employment Validation
      if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
      if (!formData.ssn.trim()) {
        newErrors.ssn = 'SSN is required';
      } else if (!/^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)) {
        newErrors.ssn = 'SSN format: XXX-XX-XXXX';
      }
      if (!formData.idIssueDate) newErrors.idIssueDate = 'ID issue date is required';
      if (!formData.idExpiryDate) newErrors.idExpiryDate = 'ID expiry date is required';
      if (formData.employmentStatus === 'employed' || formData.employmentStatus === 'self_employed') {
        if (!formData.employerName.trim()) newErrors.employerName = 'Employer name is required';
        if (!formData.monthlyIncome.trim()) newErrors.monthlyIncome = 'Monthly income is required';
      }
    }

    if (step === 4) {
      // Financial Information Validation
      if (!formData.estimatedMonthlyDeposits.trim()) newErrors.estimatedMonthlyDeposits = 'Estimated monthly deposits required';
      if (!formData.estimatedMonthlyWithdrawals.trim()) newErrors.estimatedMonthlyWithdrawals = 'Estimated monthly withdrawals required';
      if (formData.hasOtherBankAccounts && !formData.otherBankDetails.trim()) {
        newErrors.otherBankDetails = 'Please provide other bank details';
      }
      if (formData.hasLoans && !formData.loanDetails.trim()) {
        newErrors.loanDetails = 'Please provide loan details';
      }
    }

    if (step === 5) {
      // Legal & Compliance Validation
      if (formData.isPoliticallyExposed && !formData.politicalExposureDetails.trim()) {
        newErrors.politicalExposureDetails = 'Please provide political exposure details';
      }
      if (!formData.isTaxResident && !formData.taxResidentCountries.trim()) {
        newErrors.taxResidentCountries = 'Please specify tax resident countries';
      }
      if (formData.hasConvictions && !formData.convictionDetails.trim()) {
        newErrors.convictionDetails = 'Please provide conviction details';
      }
    }

    if (step === 6) {
      // Final Step Validation
      if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
      if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency contact phone is required';
      if (!formData.emergencyContactRelationship.trim()) newErrors.emergencyContactRelationship = 'Emergency contact relationship is required';
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to terms and conditions' as any;
      if (!formData.agreeToPrivacyPolicy) newErrors.agreeToPrivacyPolicy = 'You must agree to privacy policy' as any;
      if (!formData.confirmInformationAccuracy) newErrors.confirmInformationAccuracy = 'You must confirm information accuracy' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsTransitioning(false);
    }, 150);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(6)) return;
    
    setLoading(true);

    try {
      const success = await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        phone: formData.phoneNumber,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        idNumber: formData.idNumber
      });
      
      // Only redirect if registration was successful
      if (success) {
        router.push('/verification-pending');
      } else {
        // Registration failed, error already shown by useAuth
        setCurrentStep(1);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Extract error message from different possible error formats
      let errorMessage = 'Registration failed';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show error and go back to first step
      setErrors({ email: errorMessage });
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const stepContent = (() => {
      switch (currentStep) {
        case 1:
          return (
            <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's start with your basic details</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`form-input ${errors.firstName ? 'form-error' : ''}`}
                  placeholder="John"
                />
                {errors.firstName && <p className="error-text">{errors.firstName}</p>}
              </div>

              <div>
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`form-input ${errors.lastName ? 'form-error' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="error-text">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="form-input"
                placeholder="Optional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Marital Status *</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'form-error' : ''}`}
                placeholder="john.doe@example.com"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <PasswordInput
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  error={errors.password}
                  onValidationChange={setPasswordValidation}
                />
              </div>

              <div>
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  required
                  error={errors.confirmPassword}
                  showValidation={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormattedInput
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(value) => handleFormattedChange('phoneNumber', value)}
                  formatter={formatPhoneNumber}
                  placeholder="(555) 123-4567"
                  required
                  error={errors.phoneNumber}
                  maxLength={14}
                />
              </div>

              <div>
                <label className="form-label">Alternate Phone</label>
                <input
                  type="tel"
                  name="alternatePhoneNumber"
                  value={formData.alternatePhoneNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`form-input ${errors.dateOfBirth ? 'form-error' : ''}`}
                />
                {errors.dateOfBirth && <p className="error-text">{errors.dateOfBirth}</p>}
              </div>

              <div>
                <label className="form-label">Nationality *</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className={`form-input ${errors.nationality ? 'form-error' : ''}`}
                  placeholder="United States"
                />
                {errors.nationality && <p className="error-text">{errors.nationality}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
              <p className="text-gray-600">Your current residential address</p>
            </div>

            <div>
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className={`form-input ${errors.street ? 'form-error' : ''}`}
                placeholder="123 Main Street, Apt 4B"
              />
              {errors.street && <p className="error-text">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <AutocompleteInput
                  label="City"
                  value={formData.city}
                  onChange={(value) => handleFormattedChange('city', value)}
                  options={MAJOR_CITIES}
                  placeholder="New York"
                  required
                  error={errors.city}
                />
              </div>

              <div>
                <AutocompleteInput
                  label="State/Province"
                  value={formData.state}
                  onChange={(value) => handleFormattedChange('state', value)}
                  options={US_STATES}
                  placeholder="New York"
                  required
                  error={errors.state}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">ZIP/Postal Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`input ${errors.zipCode ? 'input-error' : ''}`}
                  placeholder="10001"
                  maxLength={10}
                />
                {errors.zipCode && <p className="form-error">{errors.zipCode}</p>}
              </div>

              <div>
                <label className="form-label">Country *</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`form-input ${errors.country ? 'form-error' : ''}`}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
                {errors.country && <p className="error-text">{errors.country}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Residence Type *</label>
                <select
                  name="residenceType"
                  value={formData.residenceType}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="owned">Owned</option>
                  <option value="rented">Rented</option>
                  <option value="family">Family Home</option>
                </select>
              </div>

              <div>
                <label className="form-label">Years at Address *</label>
                <select
                  name="yearsAtAddress"
                  value={formData.yearsAtAddress}
                  onChange={handleChange}
                  className={`form-input ${errors.yearsAtAddress ? 'form-error' : ''}`}
                >
                  <option value="">Select...</option>
                  <option value="0-1">0-1 years</option>
                  <option value="1-2">1-2 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
                {errors.yearsAtAddress && <p className="error-text">{errors.yearsAtAddress}</p>}
              </div>
            </div>

            {formData.yearsAtAddress === '0-1' || formData.yearsAtAddress === '1-2' ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-3">Previous Address Required</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="previousStreet"
                    value={formData.previousStreet}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Previous street address"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="previousCity"
                      value={formData.previousCity}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Previous city"
                    />
                    <input
                      type="text"
                      name="previousState"
                      value={formData.previousState}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Previous state"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Identity & Employment</h2>
              <p className="text-gray-600">Identity verification and employment details</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Identity Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">ID Type *</label>
                  <select
                    name="idType"
                    value={formData.idType}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="driver_license">Driver's License</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">ID Number *</label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    className={`form-input ${errors.idNumber ? 'form-error' : ''}`}
                    placeholder="ID123456789"
                  />
                  {errors.idNumber && <p className="error-text">{errors.idNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="form-label">ID Issue Date *</label>
                  <input
                    type="date"
                    name="idIssueDate"
                    value={formData.idIssueDate}
                    onChange={handleChange}
                    className={`form-input ${errors.idIssueDate ? 'form-error' : ''}`}
                  />
                  {errors.idIssueDate && <p className="error-text">{errors.idIssueDate}</p>}
                </div>

                <div>
                  <label className="form-label">ID Expiry Date *</label>
                  <input
                    type="date"
                    name="idExpiryDate"
                    value={formData.idExpiryDate}
                    onChange={handleChange}
                    className={`form-input ${errors.idExpiryDate ? 'form-error' : ''}`}
                  />
                  {errors.idExpiryDate && <p className="error-text">{errors.idExpiryDate}</p>}
                </div>
              </div>

              <div>
                <FormattedInput
                  label="Social Security Number"
                  value={formData.ssn}
                  onChange={(value) => handleFormattedChange('ssn', value)}
                  formatter={formatSSN}
                  placeholder="123-45-6789"
                  required
                  error={errors.ssn}
                  maxLength={11}
                />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-3">Employment Information</h4>
              <div>
                <label className="form-label">Employment Status *</label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="employed">Employed</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'self_employed') && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Employer/Company Name *</label>
                      <input
                        type="text"
                        name="employerName"
                        value={formData.employerName}
                        onChange={handleChange}
                        className={`form-input ${errors.employerName ? 'form-error' : ''}`}
                        placeholder="ABC Corporation"
                      />
                      {errors.employerName && <p className="error-text">{errors.employerName}</p>}
                    </div>

                    <div>
                      <label className="form-label">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Software Engineer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Monthly Income *</label>
                      <select
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleChange}
                        className={`form-input ${errors.monthlyIncome ? 'form-error' : ''}`}
                      >
                        <option value="">Select range...</option>
                        <option value="0-2000">$0 - $2,000</option>
                        <option value="2000-5000">$2,000 - $5,000</option>
                        <option value="5000-10000">$5,000 - $10,000</option>
                        <option value="10000+">$10,000+</option>
                      </select>
                      {errors.monthlyIncome && <p className="error-text">{errors.monthlyIncome}</p>}
                    </div>

                    <div>
                      <label className="form-label">Industry Type</label>
                      <select
                        name="industryType"
                        value={formData.industryType}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="">Select...</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
              <p className="text-gray-600">Where can we reach you?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className={`input ${errors.street ? 'border-red-300' : ''}`}
                placeholder="123 Main Street"
              />
              {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`input ${errors.city ? 'border-red-300' : ''}`}
                  placeholder="New York"
                />
                {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`input ${errors.state ? 'border-red-300' : ''}`}
                  placeholder="NY"
                />
                {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`input ${errors.zipCode ? 'border-red-300' : ''}`}
                  placeholder="10001"
                />
                {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`input ${errors.country ? 'border-red-300' : ''}`}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
                {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Identity Verification</h2>
              <p className="text-gray-600">Help us verify your identity</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Type *
              </label>
              <select
                name="idType"
                value={formData.idType}
                onChange={handleChange}
                className="input"
              >
                <option value="driver_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID Number *
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                className={`input ${errors.idNumber ? 'border-red-300' : ''}`}
                placeholder="Enter your ID number"
              />
              {errors.idNumber && <p className="text-red-600 text-sm mt-1">{errors.idNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Security Number *
              </label>
              <input
                type="text"
                name="ssn"
                value={formData.ssn}
                onChange={handleChange}
                className={`input ${errors.ssn ? 'border-red-300' : ''}`}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
              />
              {errors.ssn && <p className="text-red-600 text-sm mt-1">{errors.ssn}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Security Notice</h3>
              <p className="text-blue-800 text-sm">
                Your personal information is encrypted and secure. We use bank-level 
                security to protect your data and comply with financial regulations.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Financial Information</h2>
              <p className="text-gray-600">Help us understand your financial profile</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Source of Funds *</label>
                <select
                  name="sourceOfFunds"
                  value={formData.sourceOfFunds}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="salary">Salary/Wages</option>
                  <option value="business">Business Income</option>
                  <option value="investment">Investment Returns</option>
                  <option value="inheritance">Inheritance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Account Type *</label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="business">Business Account</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Expected Monthly Deposits *</label>
                <select
                  name="estimatedMonthlyDeposits"
                  value={formData.estimatedMonthlyDeposits}
                  onChange={handleChange}
                  className={`form-input ${errors.estimatedMonthlyDeposits ? 'form-error' : ''}`}
                >
                  <option value="">Select range...</option>
                  <option value="0-1000">$0 - $1,000</option>
                  <option value="1000-5000">$1,000 - $5,000</option>
                  <option value="5000-10000">$5,000 - $10,000</option>
                  <option value="10000+">$10,000+</option>
                </select>
                {errors.estimatedMonthlyDeposits && <p className="error-text">{errors.estimatedMonthlyDeposits}</p>}
              </div>

              <div>
                <label className="form-label">Expected Monthly Withdrawals *</label>
                <select
                  name="estimatedMonthlyWithdrawals"
                  value={formData.estimatedMonthlyWithdrawals}
                  onChange={handleChange}
                  className={`form-input ${errors.estimatedMonthlyWithdrawals ? 'form-error' : ''}`}
                >
                  <option value="">Select range...</option>
                  <option value="0-1000">$0 - $1,000</option>
                  <option value="1000-5000">$1,000 - $5,000</option>
                  <option value="5000-10000">$5,000 - $10,000</option>
                  <option value="10000+">$10,000+</option>
                </select>
                {errors.estimatedMonthlyWithdrawals && <p className="error-text">{errors.estimatedMonthlyWithdrawals}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasOtherBankAccounts"
                  checked={formData.hasOtherBankAccounts}
                  onChange={handleCheckboxChange}
                  className="form-checkbox mr-3"
                />
                <label className="text-sm text-gray-700">I have accounts with other banks</label>
              </div>

              {formData.hasOtherBankAccounts && (
                <textarea
                  name="otherBankDetails"
                  value={formData.otherBankDetails}
                  onChange={handleChange}
                  className={`form-input ${errors.otherBankDetails ? 'form-error' : ''}`}
                  rows={3}
                  placeholder="Please list other banks and account types..."
                />
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasLoans"
                  checked={formData.hasLoans}
                  onChange={handleCheckboxChange}
                  className="form-checkbox mr-3"
                />
                <label className="text-sm text-gray-700">I have existing loans or credit obligations</label>
              </div>

              {formData.hasLoans && (
                <textarea
                  name="loanDetails"
                  value={formData.loanDetails}
                  onChange={handleChange}
                  className={`form-input ${errors.loanDetails ? 'form-error' : ''}`}
                  rows={3}
                  placeholder="Please describe your loans (mortgage, car loan, etc.)..."
                />
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Legal & Compliance</h2>
              <p className="text-gray-600">Required regulatory information</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-800 mb-3">Important Legal Questions</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      name="isPoliticallyExposed"
                      checked={formData.isPoliticallyExposed}
                      onChange={handleCheckboxChange}
                      className="form-checkbox mr-3"
                    />
                    <label className="text-sm text-gray-700">I am a politically exposed person (PEP) or related to one</label>
                  </div>
                  {formData.isPoliticallyExposed && (
                    <textarea
                      name="politicalExposureDetails"
                      value={formData.politicalExposureDetails}
                      onChange={handleChange}
                      className={`form-input ${errors.politicalExposureDetails ? 'form-error' : ''}`}
                      rows={3}
                      placeholder="Please provide details about your political exposure..."
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      name="hasConvictions"
                      checked={formData.hasConvictions}
                      onChange={handleCheckboxChange}
                      className="form-checkbox mr-3"
                    />
                    <label className="text-sm text-gray-700">I have been convicted of a financial crime</label>
                  </div>
                  {formData.hasConvictions && (
                    <textarea
                      name="convictionDetails"
                      value={formData.convictionDetails}
                      onChange={handleChange}
                      className={`form-input ${errors.convictionDetails ? 'form-error' : ''}`}
                      rows={3}
                      placeholder="Please provide details..."
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      name="isTaxResident"
                      checked={formData.isTaxResident}
                      onChange={handleCheckboxChange}
                      className="form-checkbox mr-3"
                    />
                    <label className="text-sm text-gray-700">I am a tax resident of the United States</label>
                  </div>
                  {!formData.isTaxResident && (
                    <input
                      type="text"
                      name="taxResidentCountries"
                      value={formData.taxResidentCountries}
                      onChange={handleChange}
                      className={`form-input ${errors.taxResidentCountries ? 'form-error' : ''}`}
                      placeholder="Please specify your tax resident countries..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Final Details</h2>
              <p className="text-gray-600">Emergency contact and agreements</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">Emergency Contact</h4>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Emergency Contact Name *</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className={`form-input ${errors.emergencyContactName ? 'form-error' : ''}`}
                    placeholder="Full name"
                  />
                  {errors.emergencyContactName && <p className="error-text">{errors.emergencyContactName}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      className={`form-input ${errors.emergencyContactPhone ? 'form-error' : ''}`}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.emergencyContactPhone && <p className="error-text">{errors.emergencyContactPhone}</p>}
                  </div>

                  <div>
                    <label className="form-label">Relationship *</label>
                    <select
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleChange}
                      className={`form-input ${errors.emergencyContactRelationship ? 'form-error' : ''}`}
                    >
                      <option value="">Select...</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.emergencyContactRelationship && <p className="error-text">{errors.emergencyContactRelationship}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-3">Banking Preferences</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Preferred Language</label>
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Communication Preference</label>
                  <select
                    name="communicationPreference"
                    value={formData.communicationPreference}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="mail">Mail</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleCheckboxChange}
                  className="form-checkbox mr-3 mt-1"
                />
                <label className="text-sm text-gray-700">
                  I agree to the <a href="#" className="text-blue-600 underline">Terms and Conditions</a> *
                </label>
              </div>
              {errors.agreeToTerms && <p className="error-text">{errors.agreeToTerms}</p>}

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToPrivacyPolicy"
                  checked={formData.agreeToPrivacyPolicy}
                  onChange={handleCheckboxChange}
                  className="form-checkbox mr-3 mt-1"
                />
                <label className="text-sm text-gray-700">
                  I agree to the <a href="#" className="text-blue-600 underline">Privacy Policy</a> *
                </label>
              </div>
              {errors.agreeToPrivacyPolicy && <p className="error-text">{errors.agreeToPrivacyPolicy}</p>}

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToMarketingCommunications"
                  checked={formData.agreeToMarketingCommunications}
                  onChange={handleCheckboxChange}
                  className="form-checkbox mr-3 mt-1"
                />
                <label className="text-sm text-gray-700">
                  I agree to receive marketing communications (optional)
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  name="confirmInformationAccuracy"
                  checked={formData.confirmInformationAccuracy}
                  onChange={handleCheckboxChange}
                  className="form-checkbox mr-3 mt-1"
                />
                <label className="text-sm text-gray-700">
                  I confirm that all information provided is accurate and complete *
                </label>
              </div>
              {errors.confirmInformationAccuracy && <p className="error-text">{errors.confirmInformationAccuracy}</p>}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">Important Notice</h4>
              <p className="text-yellow-700 text-sm">
                Your account will be reviewed by our compliance team within 1-2 business days. 
                You will receive an email notification once your account is approved and your 
                account number is assigned.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
    })();

    return (
      <div 
        key={currentStep} 
        className="form-step transition-all duration-500 ease-in-out transform"
      >
        {stepContent}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">LumaTrust</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join thousands of satisfied customers</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 6 && (
                  <div className={`w-12 h-0.5 ml-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form onSubmit={currentStep === 6 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            <div className={`form-step ${isTransitioning ? 'transitioning' : ''}`}>
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`btn btn-secondary ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`btn btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Account...' : currentStep === 6 ? 'Create Account' : 'Next'}
              </button>
            </div>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}