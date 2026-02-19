# Design Document

## Overview

The lease settlement feature provides a comprehensive interface for rental managers to complete vehicle lease settlements. The design follows WeChat Mini Program best practices and utilizes Vant WeApp components for consistent UI/UX. The page is structured in three distinct sections: vehicle information display, unsettled rental records, and settlement form with photo upload and confirmation dialog.

## Architecture

### Component Structure
```
lease-end/
├── lease-end.js       # Page logic and data management
├── lease-end.json     # Page configuration and component imports
├── lease-end.wxml     # Page template with three-section layout
└── lease-end.wxss     # Page-specific styles
```

### Data Flow
1. **Page Load**: Receive car_id parameter → Fetch vehicle info → Fetch unsettled rentals
2. **User Interaction**: Upload photos → Add notes → Trigger settlement
3. **Settlement Process**: Show confirmation dialog → Update database → Navigate back

## Components and Interfaces

### Page Data Structure
```javascript
data: {
  carId: '',
  vehicleInfo: {
    _id: '',
    carname: '',
    cover_image: {},
    status: 0
  },
  rentalRecords: [],
  settlementPhotos: [],
  settlementNotes: '',
  showConfirmDialog: false,
  loading: false
}
```

### Key Methods
- `onLoad(options)`: Initialize page with car_id parameter
- `loadVehicleInfo()`: Fetch vehicle details from database
- `loadRentalRecords()`: Fetch unsettled rental records
- `afterPhotoUpload(event)`: Handle photo upload completion
- `deletePhoto(event)`: Remove uploaded photo
- `onNotesChange(event)`: Update settlement notes
- `showSettlementDialog()`: Display confirmation dialog
- `confirmSettlement()`: Process settlement and update database

### Vant WeApp Components Used
- `van-card`: Vehicle information display
- `van-cell-group` + `van-cell`: Rental records list
- `van-uploader`: Photo upload functionality
- `van-field`: Settlement notes input
- `van-button`: Action buttons
- `van-dialog`: Settlement confirmation
- `van-loading`: Loading states
- `van-toast`: Success/error messages

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vehicle Information Loading
*For any* valid car_id, when the lease-end page loads, the system should display the vehicle's name, cover image, and current status
**Validates: Requirements 1.1, 1.2**

### Property 2: Unsettled Records Retrieval and Display
*For any* vehicle with rental records, the system should retrieve and display only unsettled records (status = 0) in chronological order, showing renter name, rental period, and status for each record
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Photo Upload Limit Enforcement
*For any* photo upload attempt, the system should accept up to 3 images and reject any additional uploads beyond the limit
**Validates: Requirements 3.2**

### Property 4: Photo Lifecycle Management
*For any* uploaded settlement photo, the system should store it in WeChat Cloud Storage and allow deletion before settlement completion
**Validates: Requirements 3.4, 3.5**

### Property 5: Notes Character Limit Validation
*For any* settlement notes input, the system should accept text up to 500 characters and enforce the character limit
**Validates: Requirements 4.2**

### Property 6: Dialog Information Display
*For any* settlement confirmation dialog, the system should display the vehicle name and rental summary information
**Validates: Requirements 5.2**

### Property 7: Comprehensive Settlement Processing
*For any* confirmed settlement, the system should update all unsettled rental records to settled status (status = 1), update vehicle status to available (status = 0), and save settlement photos and notes to each rental record
**Validates: Requirements 6.1, 6.2, 6.3**

## Data Models

### Vehicle Information Model
```javascript
{
  _id: string,
  carname: string,
  cover_image: {
    url: string,
    name: string
  },
  status: number // 0=idle, 1=rented
}
```

### Rental Record Model
```javascript
{
  _id: string,
  car_id: string,
  renter_name: string,
  renter_detail: object,
  start_time: Date,
  end_time: Date,
  status: number, // 0=unsettled, 1=settled
  settlement_photos: array,
  settlement_notes: string,
  settlement_time: Date
}
```

### Settlement Photo Model
```javascript
{
  url: string,      // WeChat Cloud Storage file ID
  name: string,     // Display name
  size: number      // File size in bytes
}
```

## Page Layout Design

### Three-Section Layout
```
┌─────────────────────────────────┐
│        Vehicle Section          │
│  ┌─────────────────────────┐   │
│  │     van-card            │   │
│  │  [Image] Vehicle Name   │   │
│  │         Status          │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│      Rental Records Section     │
│  ┌─────────────────────────┐   │
│  │    van-cell-group       │   │
│  │  ┌─────────────────┐   │   │
│  │  │ Rental Record 1 │   │   │
│  │  ├─────────────────┤   │   │
│  │  │ Rental Record 2 │   │   │
│  │  └─────────────────┘   │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│      Settlement Section         │
│  ┌─────────────────────────┐   │
│  │    van-uploader         │   │
│  │   [Photo Upload Area]   │   │
│  ├─────────────────────────┤   │
│  │     van-field           │   │
│  │   [Settlement Notes]    │   │
│  ├─────────────────────────┤   │
│  │    van-button           │   │
│  │   [Settlement Button]   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Responsive Design Considerations
- Mobile-first approach with flexible layouts
- Touch-friendly button sizes (minimum 44px)
- Adequate spacing between interactive elements
- Optimized for WeChat Mini Program viewport

## Error Handling

### Input Validation
- Invalid car_id parameters result in error messages
- Photo upload limits are enforced with user feedback
- Character limits for notes are validated with warnings
- Network failures during data loading show appropriate error states

### Database Error Handling
- Failed database queries show error messages to users
- Partial settlement failures maintain data consistency
- Cloud storage upload failures provide retry mechanisms
- Transaction rollback for failed settlement operations

### User Experience
- Loading states during data fetching and settlement processing
- Success messages for completed operations
- Clear error messages with actionable guidance
- Graceful degradation for network connectivity issues

## Testing Strategy

### Dual Testing Approach
The testing strategy combines unit tests for specific functionality with property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific examples of vehicle loading with known car_ids
- Edge cases like invalid car_ids and network failures
- Integration points between components and cloud services
- User interaction flows like photo upload and dialog confirmation

**Property-Based Tests:**
- Universal properties across all valid inputs using randomized test data
- Comprehensive input coverage through generated test cases
- Each property test runs minimum 100 iterations for thorough validation
- Tests validate the correctness properties defined above

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: lease-settlement, Property {number}: {property_text}**
- Tests use WeChat Mini Program testing framework with mock cloud services
- Generated test data includes various vehicle states, rental records, and user inputs