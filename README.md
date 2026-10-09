# Lotion Plus

[![Netlify Status](https://api.netlify.com/api/v1/badges/a4862368-865c-40a2-a74d-2c559df66683/deploy-status)](https://app.netlify.com/projects/lotionv2/deploys)
[![Access](https://img.shields.io/badge/access-public-brightgreen)](https://lotionv2.netlify.app)

> **Public demo, no login required.** Open the [live demo](https://lotionv2.netlify.app) and choose **Try the demo as a guest** to create, edit, and delete notes immediately.

**Live Demo:** [https://lotionv2.netlify.app](https://lotionv2.netlify.app)

A modern, cloud-native note-taking application built with React and AWS serverless architecture. This full-stack SPA reimagines Notion with a streamlined interface, featuring OAuth 2.0 authentication, real-time state management with Redux, and infrastructure-as-code deployment.

## Try it

The public guest mode needs no Google account, approval, or setup. Guest notes are stored in this browser only; they are not sent to the Lambda/DynamoDB backend and are cleared when you leave guest mode or start a fresh guest session.

For the full cloud-backed experience, choose **Sign in with Google**. Google OAuth remains an optional authenticated path; guest mode is available publicly without it.

> **Note:** This is a portfolio/demo project. For a production-ready note-taking app, use [Notion](https://notion.so) or a similar established service.

See [Guest Mode Architecture](docs/guest-mode/ARCHITECTURE.md) for the isolation boundary, storage schema, and a short demo script. Anyone can try the app immediately or review the source and architecture documentation.



## Features

- **Serverless Architecture**: Fully serverless backend leveraging AWS Lambda for scalable, cost-efficient operations
- **Infrastructure as Code**: Complete AWS infrastructure provisioned and managed with Terraform
- **OAuth 2.0 Authentication**: Secure Google OAuth integration for seamless user authentication
- **Rich Text Editing**: Advanced WYSIWYG editor powered by ReactQuill with Markdown support
- **State Management**: Centralized Redux store with Redux Toolkit for predictable state updates
- **Protected Routing**: Route guards with React Router v6 for secure navigation and access control
- **Responsive Design**: Mobile-first UI with CSS custom properties for theming
- **Continuous Deployment**: Automated CI/CD pipeline via Netlify for zero-downtime deployments
- **Guest Mode**: Browser-local CRUD demo that works without OAuth or backend access

## Tech Stack

### Frontend
- **Framework**: React 18 with functional components and Hooks
- **Routing**: React Router v6 with protected routes and nested layouts
- **State Management**: Redux Toolkit with async thunks for API integration
- **Rich Text Editor**: ReactQuill (Quill.js wrapper)
- **Authentication**: @react-oauth/google for OAuth 2.0 flow
- **Build Tool**: Webpack with Babel transpilation
- **Hosting**: Netlify with automatic HTTPS and CDN distribution
- **Styling**: CSS3 with custom properties and responsive design

### Backend
- **Cloud Provider**: Amazon Web Services (AWS)
- **Compute**: AWS Lambda (Node.js runtime) for serverless functions
- **Database**: Amazon DynamoDB with composite primary keys (email + note ID)
- **API**: Lambda Function URLs with CORS-enabled REST endpoints
- **Authentication**: Token-based verification with Google OAuth tokens
- **Infrastructure as Code**: Terraform for reproducible cloud infrastructure
- **Security**: IAM roles and policies for least-privilege access

### DevOps
- **Version Control**: Git
- **IaC**: Terraform for AWS resource provisioning
- **Deployment**: Netlify automated deployment from Git
- **CI/CD**: Continuous integration and deployment pipeline

## Architecture

### Backend API Endpoints

Three serverless Lambda functions handle all backend operations:

1. **`get-notes`** - Retrieve user notes
   - Method: `GET`
   - Authentication: Email and OAuth access token in headers
   - Response: JSON array of user's notes

2. **`save-note`** - Create or update notes
   - Method: `POST`
   - Authentication: Email and OAuth access token in headers
   - Payload: Note object (id, title, content, timestamp)
   - Response: Saved note confirmation

3. **`delete-note`** - Remove existing notes
   - Method: `DELETE`
   - Authentication: Email and OAuth access token in headers
   - Query Parameters: Email and note ID
   - Response: Deletion confirmation

### Data Model

**DynamoDB Schema:**
- **Partition Key**: User email (string)
- **Sort Key**: Note ID (number)
- **Attributes**: Title, Content, Timestamp

This composite key design enables efficient querying of all notes per user while maintaining unique note identification.

### System Architecture

<br/>
<p align="center">
  <img src="https://res.cloudinary.com/mkf/image/upload/v1678683690/ENSF-381/labs/lotion-backedn_djxhiv.svg" alt="lotion-architecture" width="800"/>
</p>
<br/>

**Flow:**
1. User authenticates via Google OAuth 2.0
2. React frontend dispatches Redux actions for CRUD operations
3. Requests sent to Lambda Function URLs with authentication headers
4. Lambda functions validate tokens and interact with DynamoDB
5. Responses update Redux store triggering UI re-render

Guest mode keeps the same NotesApi contract but never calls a Lambda URL. Its in-process, Lambda-shaped handlers validate a guest session and read/write a versioned browser store, allowing the product flow to be demonstrated without credentials. See the [guest-mode architecture](docs/guest-mode/ARCHITECTURE.md) for details.

## Key Technical Implementations

- **Protected Routes**: Custom route guards verify authentication before rendering components
- **Optimistic Updates**: Redux state updates immediately for responsive UX
- **Async State Management**: Redux Toolkit's `createAsyncThunk` for API calls with loading states
- **Token Validation**: Backend validates Google OAuth tokens on every request
- **Serverless Cold Start Optimization**: Lambda function configuration for minimal latency
- **DynamoDB Composite Keys**: Efficient data partitioning by user email