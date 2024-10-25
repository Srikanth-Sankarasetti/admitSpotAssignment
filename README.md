# **#Contact Management API (Express.js & Next.js with PostgreSQL)**

This project provides a full-featured contact management system with user authentication, file upload, and download capabilities. It includes JWT-based authentication, contact management, batch processing, timezone handling, and robust data validation. integreted with express js

## Features

**1. User Authentication:**
1.Registration, login, and email verification using JWT.
2.Password reset via one-time-code.

**2.Contact Management:**
1.CRUD operations for contacts with filtering, sorting, and batch processing.
2.Soft delete functionality for contacts.

**3.File Upload:**
1.CSV/Excel file upload for bulk contact creation and updates.

**Data Validation:**
1.Strong validation of inputs using Joi (or Yup).

**Security:**
1.Password hashing, rate limiting, and secure data handling.

**File Download:** 1. Generate downloadable CSV/Excel files for all contacts.

## Tech Stack

    Frontend Framework: Next.js
    Backend Framework: Express.js
    Database: PostgreSQL
    Validation: Joi
    Authentication: JWT
    Deployment: Heroku/Vercel/Render

## Prerequisites

    Make sure you have the following installed on your system:

    Node.js (>= 14.x.x)
    PostgreSQL (>= 12.x.x)

## Getting Started

**1. Clone the repository:**

    git clone https://github.com/Srikanth-Sankarasetti/admitSpotAssignment.git
    cd contact-management-api

##

## 2. Install dependencies:

npm install

## 3. Set up environment variables:

    Create a .env file in the root of your project:

# .env

    PORT=...
    DB_PORT=...
    DB_HOST=...
    DB_USER=postgres.
    DB_PASSWORD=...
    DB_NAME=...

    MAIL_HOST=...
    MAIL_PORT=...
    MAIL_USERNAME=...
    MAIL_PASSWORD=...

## Using Migrations:

    Make sure your PostgreSQL server is running, then run migrations to create the necessary tables:

    npx sequelize-cli db:migrate 5. Run the backend server:

    npm run dev
    The server should now be running at http://localhost:3000.

## Database Schema

    Below is the ER Diagram representing the relationships:

    ER Diagram:

    (User) ---- (1:N) ---- (Contact)

## Users Table:

    id (Primary Key)
    email (Unique)
    password
    emailVerified (boolean)
    createdAt, updatedAt
    verification_code
    reset_code
    verification_code_validity

## Contacts Table:

    id (Primary Key)
    userId (Foreign Key)
    name, email, phoneNumber, address, timezone
    softDeleted (boolean)
    createdAt, updatedAt

## API Documentation

    The API documentation is available via Swagger. To access the documentation:

    Visit: http://localhost:3000//admitspot/assignment
    ## Endpoints:

## Authentication:

        POST /register: User registration with email verification.
        POST /register/:id: Email Verification
        POST /login: User login using JWT.
        POST /forgetPassword : forgot password
        POST /forgetPassword/:id: Request a password reset via one-time code.

## Contact Management:

    router
    .route("/")
    .get(routeProtector, getAllContacts) : get contacts
    .post(routeProtector, createContactValidation, createContact); : Create contacts

    router
    .route("/:id")
    .delete(routeProtector, deleteContactById) :delete contacts
    .patch(routeProtector, updateContact); :Update contact by id

    router.route("/batchUpdating").post(routeProtector, batchProcessContacts); Batch Updating
    router
    .route("/upload/excel")
    .post(routeProtector, upload.single("file"), uploadExcelContacts); :Uploading file

    router.route("/download/excel").get(routeProtector, downloadContactsExcel); :downloading file
