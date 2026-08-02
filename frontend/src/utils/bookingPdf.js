import { jsPDF } from "jspdf";

/**
 * Generates and downloads a PDF with the same booking + organizer details
 * that were sent to the user's email when they registered for the event.
 * @param {{
 *   bookingId: number,
 *   eventName: string,
 *   venue: string,
 *   eventDate: string,
 *   userName: string,
 *   userEmail: string,
 *   organizerName: string,
 *   organizerEmail: string,
 *   organizerPhone: string,
 *   bookedAt: string,
 * }} booking
 */
export function downloadBookingPdf(booking) {
  const doc = new jsPDF();
  const marginX = 20;
  let y = 22;

  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("Sports EMS — Booking Confirmation", marginX, y);

  y += 12;
  doc.setDrawColor(200);
  doc.line(marginX, y, 190, y);

  const addRow = (label, value) => {
    y += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont(undefined, "normal");
    doc.text(String(value ?? "—"), marginX + 45, y);
  };

  y += 6;
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Booking Details", marginX, y);
  doc.setFont(undefined, "normal");

  addRow("Booking ID", `#${booking.bookingId}`);
  addRow("Event", booking.eventName);
  addRow("Venue", booking.venue);
  addRow("Date", booking.eventDate);
  addRow("Registered By", `${booking.userName || ""} (${booking.userEmail || ""})`);
  addRow("No. of Tickets", booking.numberOfTickets || 1);
  if (booking.totalAmount != null) {
    addRow("Total Amount", `₹${Number(booking.totalAmount).toFixed(2)}`);
  }
  addRow("Booked On", booking.bookedAt ? new Date(booking.bookedAt).toLocaleString("en-IN") : "—");

  y += 16;
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  doc.text("Event Organizer", marginX, y);
  doc.setFont(undefined, "normal");

  addRow("Name", booking.organizerName);
  addRow("Email", booking.organizerEmail);
  addRow("Phone", booking.organizerPhone);

  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    "For any questions about this event, please contact the organizer above.",
    marginX,
    y
  );

  doc.save(`booking-${booking.bookingId}-${(booking.eventName || "event").replace(/\s+/g, "_")}.pdf`);
}
