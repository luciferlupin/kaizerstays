import GuestPortalClient from "./GuestPortalClient";

export const metadata = {
  title: "Guest Self-Service Portal — KaizerStays",
};

export default async function GuestPortalPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const { reservationId } = await params;
  return <GuestPortalClient reservationId={reservationId} />;
}
