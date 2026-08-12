export async function GET() {
  return Response.json({
    status: "ok",
    service: "authors-workbench-backend",
  });
}
