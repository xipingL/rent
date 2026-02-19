# Implementation Plan: Lease Settlement

## Overview

This implementation plan breaks down the lease settlement feature into discrete coding tasks. The approach follows WeChat Mini Program conventions and utilizes Vant WeApp components for UI consistency. Tasks are organized to build incrementally, starting with page structure, then data loading, user interactions, and finally settlement processing.

## Tasks

- [x] 1. Set up lease-end page structure and configuration
  - Create lease-end page files (js, json, wxml, wxss)
  - Configure Vant WeApp components in page json
  - Set up basic page layout with three sections
  - _Requirements: 8.1_

- [x] 2. Implement vehicle information loading and display
  - [x] 2.1 Add page data structure for vehicle info
    - Define vehicleInfo data model in page data
    - Add carId parameter handling in onLoad
    - _Requirements: 1.1_

  - [x] 2.2 Implement loadVehicleInfo method
    - Query car collection by car_id
    - Handle success and error cases
    - Update page data with vehicle information
    - _Requirements: 1.1, 1.3_

  - [x] 2.3 Create vehicle information display section
    - Use van-card component for vehicle display
    - Bind vehicle name, cover image, and status
    - Add loading state handling
    - _Requirements: 1.2_

  - [ ] 2.4 Write property test for vehicle information loading

    - **Property 1: Vehicle Information Loading**
    - **Validates: Requirements 1.1, 1.2**

- [x] 3. Implement rental records loading and display
  - [x] 3.1 Add rental records data structure
    - Define rentalRecords array in page data
    - Add loading state for rental records
    - _Requirements: 2.1_

  - [x] 3.2 Implement loadRentalRecords method
    - Query rent collection by car_id and status=0
    - Sort records by start_time chronologically
    - Handle empty results and errors
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Create rental records display section
    - Use van-cell-group and van-cell for records list
    - Display renter name, rental period, and status
    - Format dates for display
    - _Requirements: 2.3, 2.4_

  - [ ]* 3.4 Write property test for unsettled records retrieval
    - **Property 2: Unsettled Records Retrieval and Display**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 4. Checkpoint - Ensure data loading works correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement settlement photo upload functionality
  - [x] 5.1 Add photo upload data structure
    - Define settlementPhotos array in page data
    - Add photo upload configuration
    - _Requirements: 3.1_

  - [x] 5.2 Implement afterPhotoUpload method
    - Handle van-uploader after-read event
    - Upload to WeChat Cloud Storage
    - Enforce 3-photo limit
    - Add uploaded photo to settlementPhotos array
    - _Requirements: 3.2, 3.4_

  - [x] 5.3 Implement deletePhoto method
    - Remove photo from settlementPhotos array
    - Delete file from Cloud Storage
    - Update UI state
    - _Requirements: 3.5_

  - [x] 5.4 Create photo upload UI section
    - Use van-uploader component
    - Configure max-count to 3
    - Bind afterPhotoUpload and delete handlers
    - Show upload limit warning
    - _Requirements: 3.1, 3.3_

  - [ ]* 5.5 Write property test for photo upload limit
    - **Property 3: Photo Upload Limit Enforcement**
    - **Validates: Requirements 3.2**

  - [ ]* 5.6 Write property test for photo lifecycle
    - **Property 4: Photo Lifecycle Management**
    - **Validates: Requirements 3.4, 3.5**

- [x] 6. Implement settlement notes functionality
  - [x] 6.1 Add settlement notes data structure
    - Define settlementNotes string in page data
    - Add character count tracking
    - _Requirements: 4.1_

  - [x] 6.2 Implement onNotesChange method
    - Handle van-field input event
    - Enforce 500 character limit
    - Update settlementNotes data
    - _Requirements: 4.2_

  - [x] 6.3 Create settlement notes UI section
    - Use van-field component with textarea type
    - Set maxlength to 500
    - Show character count
    - Display warning when limit approached
    - _Requirements: 4.1, 4.3_

  - [ ]* 6.4 Write property test for notes character limit
    - **Property 5: Notes Character Limit Validation**
    - **Validates: Requirements 4.2**

- [x] 7. Implement settlement confirmation dialog
  - [x] 7.1 Add dialog state management
    - Define showConfirmDialog boolean in page data
    - Add dialog summary data structure
    - _Requirements: 5.1_

  - [x] 7.2 Implement showSettlementDialog method
    - Validate settlement form (photos and notes)
    - Prepare dialog summary information
    - Show van-dialog with vehicle and rental summary
    - _Requirements: 5.1, 5.2_

  - [x] 7.3 Create settlement button and dialog UI
    - Add van-button for settlement trigger
    - Configure van-dialog component
    - Display vehicle name and rental summary
    - Add Confirm and Cancel buttons
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.4 Implement dialog cancel handler
    - Close dialog without processing
    - Maintain current state
    - _Requirements: 5.4_

  - [ ]* 7.5 Write property test for dialog information display
    - **Property 6: Dialog Information Display**
    - **Validates: Requirements 5.2**

- [ ] 8. Checkpoint - Ensure UI interactions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement settlement processing logic
  - [x] 9.1 Implement confirmSettlement method
    - Show loading state
    - Update all unsettled rental records to status=1
    - Add settlement_photos, settlement_notes, settlement_time to each record
    - Update vehicle status to 0
    - Handle transaction errors with rollback
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 Add success and error handling
    - Show success toast on completion
    - Show error toast on failure
    - Navigate back to garage page on success
    - Maintain state on error
    - _Requirements: 6.4, 6.5, 8.3_

  - [ ]* 9.3 Write property test for comprehensive settlement processing
    - **Property 7: Comprehensive Settlement Processing**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 10. Update garage page navigation
  - [x] 10.1 Verify turnToLeaseEnd method in garage.js
    - Ensure car_id is passed correctly as parameter
    - Test navigation to lease-end page
    - _Requirements: 8.3_

- [x] 11. Add error handling and edge cases
  - [x] 11.1 Handle invalid car_id parameter
    - Show error message for missing or invalid car_id
    - Provide navigation back to garage
    - _Requirements: 1.3_

  - [x] 11.2 Handle network errors
    - Add retry mechanisms for failed requests
    - Show appropriate error messages
    - Maintain user input during errors
    - _Requirements: Error Handling_

  - [x] 11.3 Add loading states
    - Show van-loading during data fetching
    - Disable settlement button during processing
    - Prevent duplicate submissions
    - _Requirements: Error Handling_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All database operations use WeChat Cloud Database API
- All file uploads use WeChat Cloud Storage API
- UI components follow Vant WeApp conventions