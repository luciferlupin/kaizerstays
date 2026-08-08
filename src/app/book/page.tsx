import BookingClient from "./BookingClient";

export const metadata = {
  title: "Book Direct — Hotel Shemron Neemrana | StaySphere",
  description: "Official direct booking portal for Hotel Shemron Neemrana. Best rate guarantee, 0% commission.",
};

export default function PublicBookingPage() {
  return <BookingClient />;
}
