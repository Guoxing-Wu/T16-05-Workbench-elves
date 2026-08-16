## Create Project

### Endpoint
POST /api/projects

### Request
{
  "title": "My Novel",
  "targetWordCount": 80000,
  "averageChapterLength": 4000
}

### Success Response
Status: 201 Created

{
  "id": 2,
  "title": "My Novel",
  "targetWordCount": 80000,
  "averageChapterLength": 4000,
  "numberOfChapters": 20,
  "createdAt": "...",
  "updatedAt": "..."
}

### Error Response
Status: 400 Bad Request

{
  "error": "Invalid project data"
}