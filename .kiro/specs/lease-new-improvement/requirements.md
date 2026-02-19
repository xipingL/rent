# Requirements Document

## Introduction

This specification defines the improvement of the lease-new page functionality for the Crent car rental management system. The feature enhances the existing three-section layout with better UI design, improved logic robustness, and adds a confirmation dialog for lease creation.

## Glossary

- **Lease_Creation_System**: The improved lease creation module of the Crent application
- **Vehicle_Modification_Section**: First section for editing vehicle information
- **Renter_Information_Section**: Second section for entering renter details
- **Lease_Information_Section**: Third section for setting lease terms
- **Confirmation_Dialog**: Final confirmation popup showing all lease details
- **Step_Navigation**: Navigation controls between the three sections

## Requirements

### Requirement 1: Enhanced Vehicle Modification Section

**User Story:** As a rental manager, I want an improved vehicle modification interface, so that I can efficiently update vehicle information with better visual design and validation.

#### Acceptance Criteria

1. THE Lease_Creation_System SHALL display vehicle information in a visually appealing card layout
2. WHEN vehicle images are uploaded, THE Lease_Creation_System SHALL provide clear visual feedback and progress indicators
3. THE Lease_Creation_System SHALL validate vehicle name input and prevent empty submissions
4. WHEN vehicle information is modified, THE Lease_Creation_System SHALL track changes for confirmation display
5. THE Lease_Creation_System SHALL provide intuitive image management with clear upload and delete actions

### Requirement 2: Enhanced Renter Information Section

**User Story:** As a rental manager, I want an improved renter information interface, so that I can collect complete renter details with better validation and user experience.

#### Acceptance Criteria

1. THE Lease_Creation_System SHALL provide a clean form layout for renter information input
2. THE Lease_Creation_System SHALL validate renter name input and require non-empty values
3. WHEN ID card photos are uploaded, THE Lease_Creation_System SHALL enforce exactly 2 photos (front and back sides)
4. THE Lease_Creation_System SHALL display clear labels indicating "身份证正面" and "身份证反面" for the two required photos
5. THE Lease_Creation_System SHALL prevent submission if ID card photos count is not exactly 2
6. THE Lease_Creation_System SHALL provide clear visual indicators showing "需要上传身份证正反两面" status
7. THE Lease_Creation_System SHALL validate ID card photo uploads and show appropriate error messages

### Requirement 3: Enhanced Lease Information Section

**User Story:** As a rental manager, I want an improved lease terms interface, so that I can set lease duration and dates with better validation and user experience.

#### Acceptance Criteria

1. THE Lease_Creation_System SHALL provide intuitive date and duration selection interfaces
2. THE Lease_Creation_System SHALL validate that start date is not in the past
3. THE Lease_Creation_System SHALL validate that lease duration is not zero
4. THE Lease_Creation_System SHALL automatically calculate and display end date based on start date and duration
5. THE Lease_Creation_System SHALL prevent invalid date combinations and show clear error messages

### Requirement 4: Improved Step Navigation

**User Story:** As a rental manager, I want better navigation between sections, so that I can move through the lease creation process efficiently with proper validation.

#### Acceptance Criteria

1. THE Lease_Creation_System SHALL validate current section before allowing navigation to next step
2. WHEN validation fails, THE Lease_Creation_System SHALL show specific error messages and prevent navigation
3. THE Lease_Creation_System SHALL provide clear visual indicators of current step and completion status
4. THE Lease_Creation_System SHALL allow backward navigation without validation restrictions
5. THE Lease_Creation_System SHALL disable next/submit buttons when validation requirements are not met

### Requirement 5: Lease Confirmation Dialog

**User Story:** As a rental manager, I want to review all lease details before creation, so that I can avoid errors and confirm all information is correct.

#### Acceptance Criteria

1. WHEN the submit button is clicked, THE Lease_Creation_System SHALL display a confirmation dialog
2. THE Confirmation_Dialog SHALL show vehicle information including name and images
3. THE Confirmation_Dialog SHALL show renter information including name and ID verification status
4. THE Confirmation_Dialog SHALL show lease terms including start date, duration, and end date
5. THE Confirmation_Dialog SHALL provide "Confirm" and "Cancel" options
6. WHEN "Cancel" is selected, THE Confirmation_Dialog SHALL close without processing
7. WHEN "Confirm" is selected, THE Lease_Creation_System SHALL create the lease record

### Requirement 6: Lease Creation Processing

**User Story:** As a rental manager, I want reliable lease creation processing, so that lease records are properly saved and vehicle status is updated.

#### Acceptance Criteria

1. WHEN lease creation is confirmed, THE Lease_Creation_System SHALL create a new rent record with all provided information
2. THE Lease_Creation_System SHALL update the vehicle status to rented (status = 1)
3. THE Lease_Creation_System SHALL save all uploaded images to the rent record
4. WHEN lease creation is successful, THE Lease_Creation_System SHALL show a success message
5. WHEN lease creation fails, THE Lease_Creation_System SHALL show an error message and maintain current state
6. THE Lease_Creation_System SHALL navigate back to garage page after successful creation

### Requirement 7: Enhanced Error Handling and Validation

**User Story:** As a rental manager, I want comprehensive error handling, so that I receive clear feedback when issues occur during lease creation.

#### Acceptance Criteria

1. THE Lease_Creation_System SHALL validate all required fields before allowing submission
2. WHEN network errors occur, THE Lease_Creation_System SHALL show appropriate error messages with retry options
3. THE Lease_Creation_System SHALL prevent duplicate submissions during processing
4. THE Lease_Creation_System SHALL validate file uploads and show progress indicators
5. THE Lease_Creation_System SHALL provide clear validation messages for each input field

### Requirement 8: Improved Visual Design and User Experience

**User Story:** As a rental manager, I want a more attractive and intuitive interface, so that lease creation is efficient and pleasant to use.

#### Acceptance Criteria

1. THE Lease_Creation_System SHALL use consistent spacing, colors, and typography throughout
2. THE Lease_Creation_System SHALL provide clear visual hierarchy with proper section separation
3. THE Lease_Creation_System SHALL use appropriate icons and visual cues for different actions
4. THE Lease_Creation_System SHALL maintain responsive design for different screen sizes
5. THE Lease_Creation_System SHALL provide smooth transitions between steps and loading states