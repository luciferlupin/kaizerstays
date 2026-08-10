export async function POST() {
  return Response.json(
    {
      success: false,
      code: "APPROVED_CONNECTIVITY_REQUIRED",
      error:
        "Direct extranet password sync is disabled. Use an approved Booking.com/Agoda connectivity API or contracted channel manager.",
    },
    { status: 501 }
  );
}
