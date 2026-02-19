# Design Document

## Overview

The lease-new improvement feature enhances the existing three-step lease creation process with better UI design, comprehensive validation, and a confirmation dialog. The design maintains the current step-based navigation while improving visual hierarchy, user feedback, and data validation throughout the process.

## Architecture

### Enhanced Component Structure
```
lease-new/
├── lease-new.js       # Enhanced page logic with validation and confirmation
├── lease-new.json     # Updated component imports including dialog
├── lease-new.wxml     # Improved three-section layout with better styling
└── lease-new.wxss     # Enhanced styles for better visual design
```

### Improved Data Flow
1. **Page Load**: Load vehicle data → Initialize validation states → Set up form tracking
2. **Step Navigation**: Validate current step → Update progress indicators → Allow/prevent navigation
3. **Form Interaction**: Real-time validation → Visual feedback → Track changes
4. **Submission**: Final validation → Show confirmation dialog → Process lease creation

## Components and Interfaces

### Enhanced Page Data Structure
```javascript
data: {
  // Existing data structure enhanced with validation
  carId: '',
  active: 0,
  car: {},
  renter: {
    name: '',
    id_card_image: []
  },
  rent_info: {
    start_time: Date,
    duration_picker_time: '',
    end_time: Date
  },
  car_change_field: {},
  
  // New validation and UI state
  validation: {
    step0: { valid: false, errors: [] },
    step1: { valid: false, errors: [] },
    step2: { valid: false, errors: [] }
  },
  showConfirmDialog: false,
  confirmationData: {},
  loading: false,
  submitDisabled: true
}
```

### Enhanced Methods
- `validateStep(stepIndex)`: Comprehensive step validation
- `updateValidationState()`: Update validation indicators
- `canNavigateNext()`: Check if navigation is allowed
- `showLeaseConfirmation()`: Display confirmation dialog with summary
- `confirmLeaseCreation()`: Process final lease creation
- `enhancedFormValidation()`: Real-time form validation
- `updateProgressIndicators()`: Visual progress feedback

### Vant WeApp Components Used
- `van-steps`: Enhanced step indicator with validation states
- `van-card`: Improved vehicle information display
- `van-cell-group` + `van-field`: Enhanced form inputs with validation
- `van-uploader`: Improved file upload with progress and validation
- `van-button`: Enhanced buttons with loading and disabled states
- `van-dialog`: Lease confirmation dialog
- `van-toast`: Success/error feedback
- `van-loading`: Loading states during processing
- `van-tag`: Status indicators and labels

## Data Models

### Enhanced Vehicle Model
```javascript
{
  _id: string,
  carname: string,
  cover_image: object,
  detail_image: array,
  mark: string,
  status: number
}
```

### Enhanced Renter Model
```javascript
{
  name: string,           // Required, non-empty
  id_card_image: [        // Exactly 2 photos required
    {
      url: string,
      name: string,       // "身份证正面" or "身份证反面"
      type: string        // "front" or "back"
    }
  ]
}
```

### Enhanced Lease Information Model
```javascript
{
  start_time: Date,       // Must be future date
  duration_picker_time: string,  // Must be non-zero
  end_time: Date,         // Auto-calculated
  timeout: string         // Formatted end time
}
```

### Validation State Model
```javascript
{
  step0: {
    valid: boolean,
    errors: [
      { field: string, message: string }
    ]
  },
  step1: {
    valid: boolean,
    errors: [
      { field: string, message: string }
    ]
  },
  step2: {
    valid: boolean,
    errors: [
      { field: string, message: string }
    ]
  }
}
```

## Enhanced Page Layout Design

### Three-Section Layout with Validation
```
┌─────────────────────────────────┐
│     Enhanced Step Indicator     │
│  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │  1  │──│  2  │──│  3  │    │
│  │ ✓/✗ │  │ ✓/✗ │  │ ✓/✗ │    │
│  └─────┘  └─────┘  └─────┘    │
├─────────────────────────────────┤
│        Section Content          │
│  ┌─────────────────────────┐   │
│  │   Step-specific Form    │   │
│  │   with Validation       │   │
│  │   ┌─────────────────┐   │   │
│  │   │ Input Fields    │   │   │
│  │   │ with Feedback   │   │   │
│  │   └─────────────────┘   │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│      Enhanced Navigation        │
│  ┌─────────┐    ┌─────────┐   │
│  │ Previous│    │Next/Submit│   │
│  │(Always) │    │(Validated)│   │
│  └─────────┘    └─────────┘   │
└─────────────────────────────────┘
```

### Step 1: Enhanced Vehicle Modification
```
┌─────────────────────────────────┐
│        Vehicle Card             │
│  ┌─────────────────────────┐   │
│  │ [Cover Image Upload]    │   │
│  │ ┌─────────────────┐     │   │
│  │ │ Vehicle Name    │ ✓   │   │
│  │ ├─────────────────┤     │   │
│  │ │ Vehicle Notes   │ ✓   │   │
│  │ └─────────────────┘     │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [Detail Images Upload]  │   │
│  │ Progress: 2/5 uploaded  │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Step 2: Enhanced Renter Information
```
┌─────────────────────────────────┐
│      Renter Information         │
│  ┌─────────────────────────┐   │
│  │ Renter Name *           │   │
│  │ [Input Field]       ✓   │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ID Card Photos *        │   │
│  │ ┌─────────┐ ┌─────────┐ │   │
│  │ │身份证正面│ │身份证反面│ │   │
│  │ │[Upload] │ │[Upload] │ │   │
│  │ └─────────┘ └─────────┘ │   │
│  │ Status: 2/2 required ✓  │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Step 3: Enhanced Lease Information
```
┌─────────────────────────────────┐
│      Lease Terms                │
│  ┌─────────────────────────┐   │
│  │ Start Date *            │   │
│  │ [Date Picker]       ✓   │   │
│  ├─────────────────────────┤   │
│  │ Duration *              │   │
│  │ [Duration Picker]   ✓   │   │
│  ├─────────────────────────┤   │
│  │ End Date (Auto)         │   │
│  │ 2024-12-31 10:30    ✓   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vehicle Information Validation and Tracking
*For any* vehicle modification, the system should validate vehicle name is non-empty, provide upload progress feedback, and track all changes for confirmation display
**Validates: Requirements 1.2, 1.3, 1.4**

### Property 2: Comprehensive Renter Information Validation
*For any* renter information input, the system should validate name is non-empty, enforce exactly 2 ID card photos (front and back), display appropriate labels and status indicators, and show validation error messages
**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

### Property 3: Lease Information Validation and Calculation
*For any* lease information input, the system should validate start date is not in the past, duration is not zero, automatically calculate end date, and prevent invalid date combinations with error messages
**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 4: Step Navigation Validation Control
*For any* step navigation attempt, the system should validate current section before allowing forward navigation, show error messages when validation fails, allow backward navigation without restrictions, and disable next/submit buttons when requirements are not met
**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

### Property 5: Step Progress and Status Indicators
*For any* step in the process, the system should provide clear visual indicators of current step and completion status
**Validates: Requirements 4.3**

### Property 6: Confirmation Dialog Content Display
*For any* confirmation dialog display, the system should show complete vehicle information, renter information with ID verification status, and lease terms including all dates and duration
**Validates: Requirements 5.2, 5.3, 5.4**

### Property 7: Comprehensive Lease Creation Processing
*For any* confirmed lease creation, the system should create a new rent record with all provided information, update vehicle status to rented (status = 1), and save all uploaded images to the rent record
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 8: Comprehensive Form Validation and Processing
*For any* form submission attempt, the system should validate all required fields, prevent duplicate submissions during processing, validate file uploads with progress indicators, and provide clear validation messages for each input field
**Validates: Requirements 7.1, 7.3, 7.4, 7.5**

## Error Handling

### Input Validation
- Real-time validation for all form fields with immediate feedback
- Comprehensive validation before step navigation and final submission
- Clear error messages with specific guidance for correction
- Prevention of invalid data entry with appropriate constraints

### File Upload Handling
- Progress indicators during upload operations
- Validation of file types and sizes
- Error handling for failed uploads with retry mechanisms
- Proper cleanup of failed or cancelled uploads

### Network and Database Errors
- Graceful handling of network connectivity issues
- Retry mechanisms for failed operations
- Error messages with actionable guidance
- State preservation during error conditions

### User Experience
- Loading states during processing operations
- Prevention of duplicate submissions
- Smooth transitions between steps and states
- Consistent error messaging throughout the application

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific functionality with property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples of form validation with known inputs
- Edge cases like network failures and invalid file uploads
- Integration points between steps and confirmation dialog
- User interaction flows like step navigation and dialog confirmation

**Property-Based Tests:**
- Universal properties across all valid inputs using randomized test data
- Comprehensive input coverage through generated test cases
- Each property test runs minimum 100 iterations for thorough validation
- Tests validate the correctness properties defined above

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: lease-new-improvement, Property {number}: {property_text}**
- Tests use WeChat Mini Program testing framework with mock cloud services
- Generated test data includes various vehicle states, renter information, and lease terms