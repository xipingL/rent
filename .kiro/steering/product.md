# Product Overview

**Crent** is a WeChat Mini Program for car rental management. It provides a simple interface for managing rental vehicles and lease operations.

## Core Features

- **Vehicle Management**: Add, edit, and delete rental cars with image uploads
- **Lease Operations**: Create new leases, extend existing ones, and process lease endings
- **Status Tracking**: Track vehicle availability (idle/rented) and lease status
- **User Interface**: Clean, mobile-first design using Vant WeApp components

## Database Schema

The application uses WeChat Cloud Database with two main collections:

### car (Vehicle Table)
- Vehicle information, images, status, and metadata
- Status: 0=idle, 1=rented

### rent (Rental Table) 
- Lease records with renter details, dates, and status
- Status: 0=active lease, 1=lease expired awaiting settlement

## Target Users

Small car rental businesses or individuals managing a fleet of rental vehicles through WeChat ecosystem.