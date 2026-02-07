import "../../../html-files/globals.css";
import "../../../html-files/style.css";
import "../../../html-files/product-style.css";
import "../../../html-files/coaches-style.css";
import "../../../html-files/veiligheid-style.css";
import "../../../html-files/over-ons-style.css";
import "../../../html-files/prijzen-style.css";

import { MarketingContent } from "./MarketingContent";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingContent>{children}</MarketingContent>;
}

