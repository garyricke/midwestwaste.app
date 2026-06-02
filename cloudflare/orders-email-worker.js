// Cloudflare Email Worker — fan out orders@midwestwaste.app to the team.
//
// Cloudflare Email Routing dashboard rules forward to a single destination, so
// to deliver one address to several inboxes we use this Worker and call
// message.forward() once per recipient.
//
// Setup (Cloudflare dashboard):
// 1. Email → Email Routing → Destination addresses: add + VERIFY each recipient
//    below (each gets a one-click confirmation email they must accept).
// 2. Email → Email Routing → Email Workers → Create → paste this code → Deploy.
// 3. Email → Email Routing → Routing rules: orders@midwestwaste.app → Send to a
//    Worker → select this worker.
//
// Note: every address in RECIPIENTS must be a verified destination, or
// forward() to it will fail.

const RECIPIENTS = [
  "tyler@midwestwasteconsultants.com",
  "greg@midwestwasteconsultants.com",
  "gary.ricke@orbisdesign.com",
];

export default {
  async email(message) {
    for (const to of RECIPIENTS) {
      await message.forward(to);
    }
  },
};
