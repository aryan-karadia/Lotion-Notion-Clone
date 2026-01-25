# Lotion Plus

[![Netlify Status](https://api.netlify.com/api/v1/badges/a4862368-865c-40a2-a74d-2c559df66683/deploy-status)](https://app.netlify.com/projects/lotionv2/deploys) \
**Live Demo:** [https://lotionv2.netlify.app](https://lotionv2.netlify.app) 

A modern, cloud-native note-taking application built with React and AWS serverless architecture. This full-stack SPA reimagines Notion with a streamlined interface, featuring OAuth 2.0 authentication, real-time state management with Redux, and infrastructure-as-code deployment.

## Features

- **Serverless Architecture**: Fully serverless backend leveraging AWS Lambda for scalable, cost-efficient operations
- **Infrastructure as Code**: Complete AWS infrastructure provisioned and managed with Terraform
- **OAuth 2.0 Authentication**: Secure Google OAuth integration for seamless user authentication
- **Rich Text Editing**: Advanced WYSIWYG editor powered by ReactQuill with Markdown support
- **State Management**: Centralized Redux store with Redux Toolkit for predictable state updates
- **Protected Routing**: Route guards with React Router v6 for secure navigation and access control
- **Responsive Design**: Mobile-first UI with CSS custom properties for theming
- **Continuous Deployment**: Automated CI/CD pipeline via Netlify for zero-downtime deployments

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

## Key Technical Implementations

- **Protected Routes**: Custom route guards verify authentication before rendering components
- **Optimistic Updates**: Redux state updates immediately for responsive UX
- **Async State Management**: Redux Toolkit's `createAsyncThunk` for API calls with loading states
- **Token Validation**: Backend validates Google OAuth tokens on every request
- **Serverless Cold Start Optimization**: Lambda function configuration for minimal latency
- **DynamoDB Composite Keys**: Efficient data partitioning by user email