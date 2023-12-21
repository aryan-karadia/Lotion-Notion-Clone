# Lotion Plus

This is a full stack application which uses React and AWS to create a Notion clone called Lotion. The front end is built using React and published using Netlify, while the back end uses 3 AWS Lambda functions, and an AWS DynamoDB table.

## Front End

The front end uses React and is hosted using Netlify, the link can be found [here](https://lotionv2.netlify.app)

Google is also used as a login method for the app using `@react-oauth/google` library.

## Back End

The backend infrastructure is created and maintained using Terraform code.

The 3 AWS Lambda functions are as follows:

  - `get-notes`: to retrieve all the notes for a user. The function reads the user email from the query parameter `email`, and receives `email` and `access_token` (this is the token you get from the Google login library) in the headers. Function URL only allows `GET` requests
  - `save-note`: to save/create/update a note for a user. The function reads the note to be saved/created/updated from the body of the request, and receives `email` and `access_token` in the headers. Function URL only allows `POST` requests
  - `delete-note`: to delete an existing note for a user. The function reads the user email from the query parameter `email`, and receives `email` and `access_token` in the headers. Function URL only allows `DELETE` requests

The DynamoDB table uses the email as a Partition Key and the note id as a Sort Key. This allows all notes to be stored without fail. 

## Architecture Overview

<br/>
<p align="center">
  <img src="https://res.cloudinary.com/mkf/image/upload/v1678683690/ENSF-381/labs/lotion-backedn_djxhiv.svg" alt="lotion-architecture" width="800"/>
</p>
<br/>
