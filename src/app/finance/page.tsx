import CatatinFinancePage from "./catatin/page";

/**
 * Finance is now an owner-first summary sourced from Catatin.
 * The legacy Moka / ESB buttons, manual entry forms, and empty NF3 Finance
 * cards are intentionally no longer rendered. No transaction data is changed.
 */
export default function FinancePage() {
  return <CatatinFinancePage />;
}
