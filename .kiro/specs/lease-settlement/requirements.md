# Requirements Document

## Introduction

This specification defines the lease settlement functionality for the Crent car rental management system. The feature allows users to complete the settlement process for vehicle rentals, including viewing vehicle and rental information, uploading settlement photos, and confirming the settlement transaction.

## Glossary

- **Settlement_System**: The lease settlement module of the Crent application
- **Vehicle_Info**: Car details including name, images, and current status
- **Rental_Records**: Historical and current lease information for a specific vehicle
- **Settlement_Photos**: Images uploaded during the settlement process (maximum 3)
- **Settlement_Notes**: Text remarks added during settlement
- **Settlement_Dialog**: Confirmation popup showing summary information

## Requirements

### Requirement 1: Vehicle Information Display

**User Story:** As a rental manager, I want to view comprehensive vehicle information during settlement, so that I can verify the correct vehicle is being processed.

#### Acceptance Criteria

1. WHEN the lease-end page loads with a car_id parameter, THE Settlement_System SHALL display the vehicle's basic information
2. THE Settlement_System SHALL show the vehicle name, cover image, and current status
3. WHEN vehicle information is unavailable, THE Settlement_System SHALL display an appropriate error message

### Requirement 2: Unsettled Rental Records Management

**User Story:** As a rental manager, I want to view only unsettled rental records for a vehicle, so that I can process all pending settlements including extensions.

#### Acceptance Criteria

1. WHEN displaying rental information, THE Settlement_System SHALL retrieve only unsettled rental records (status = 0) for the specified vehicle
2. THE Settlement_System SHALL display unsettled rental records in chronological order
3. WHEN multiple unsettled records exist due to extensions, THE Settlement_System SHALL show all unsettled records clearly
4. THE Settlement_System SHALL display renter name, rental period, and status for each unsettled record

### Requirement 3: Settlement Photo Upload

**User Story:** As a rental manager, I want to upload settlement photos, so that I can document the vehicle condition at settlement.

#### Acceptance Criteria

1. THE Settlement_System SHALL provide an interface for uploading settlement photos
2. WHEN uploading photos, THE Settlement_System SHALL accept a maximum of 3 images
3. WHEN the photo limit is exceeded, THE Settlement_System SHALL prevent additional uploads and show a warning
4. THE Settlement_System SHALL store uploaded photos in WeChat Cloud Storage
5. THE Settlement_System SHALL allow users to delete uploaded photos before settlement

### Requirement 4: Settlement Notes

**User Story:** As a rental manager, I want to add settlement notes, so that I can record important details about the settlement process.

#### Acceptance Criteria

1. THE Settlement_System SHALL provide a text input field for settlement notes
2. THE Settlement_System SHALL allow notes up to 500 characters
3. WHEN notes exceed the character limit, THE Settlement_System SHALL show a character count warning

### Requirement 5: Settlement Confirmation Dialog

**User Story:** As a rental manager, I want to confirm settlement details before completion, so that I can avoid accidental settlements.

#### Acceptance Criteria

1. WHEN the settlement button is clicked, THE Settlement_System SHALL display a confirmation dialog
2. THE Settlement_Dialog SHALL show vehicle name and rental summary information
3. THE Settlement_Dialog SHALL provide "Confirm" and "Cancel" options
4. WHEN "Cancel" is selected, THE Settlement_Dialog SHALL close without processing
5. WHEN "Confirm" is selected, THE Settlement_System SHALL process the settlement

### Requirement 6: Settlement Processing

**User Story:** As a rental manager, I want to complete the settlement process, so that the rental can be marked as finished.

#### Acceptance Criteria

1. WHEN settlement is confirmed, THE Settlement_System SHALL update all unsettled rental records (status = 0) to settled status (status = 1)
2. THE Settlement_System SHALL update the vehicle status to available (status = 0)
3. THE Settlement_System SHALL save settlement photos and notes to each rental record
4. WHEN settlement is successful, THE Settlement_System SHALL show a success message
5. WHEN settlement fails, THE Settlement_System SHALL show an error message and maintain current state

### Requirement 7: Database Schema Updates

**User Story:** As a system administrator, I want the database to support settlement information, so that settlement data can be properly stored and retrieved.

#### Acceptance Criteria

1. THE Settlement_System SHALL extend the rent table with settlement_photos field (array of objects)
2. THE Settlement_System SHALL extend the rent table with settlement_notes field (string)
3. THE Settlement_System SHALL extend the rent table with settlement_time field (date)
4. THE Settlement_System SHALL use simplified status field: 0=unsettled, 1=settled

### Requirement 8: Page Layout and Navigation

**User Story:** As a rental manager, I want an intuitive page layout, so that I can efficiently complete settlements.

#### Acceptance Criteria

1. THE Settlement_System SHALL organize the page into three distinct sections: vehicle info (top), rental records (middle), settlement form (bottom)
2. THE Settlement_System SHALL provide clear visual separation between sections
3. WHEN settlement is completed, THE Settlement_System SHALL navigate back to the garage page
4. THE Settlement_System SHALL maintain responsive design for mobile devices