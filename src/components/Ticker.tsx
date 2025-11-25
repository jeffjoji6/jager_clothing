export const Ticker = () => {
  const tickerText = "WORLDWIDE SHIPPING +++ PREMIUM QUALITY +++ JAGER CLOTHING";
  
  return (
    <div className="bg-foreground text-background overflow-hidden py-2">
      <div className="flex whitespace-nowrap">
        <div className="animate-ticker flex">
          <span className="text-xs font-heading font-bold uppercase tracking-widest px-4">
            {tickerText}
          </span>
          <span className="text-xs font-heading font-bold uppercase tracking-widest px-4">
            {tickerText}
          </span>
        </div>
        <div className="animate-ticker flex">
          <span className="text-xs font-heading font-bold uppercase tracking-widest px-4">
            {tickerText}
          </span>
          <span className="text-xs font-heading font-bold uppercase tracking-widest px-4">
            {tickerText}
          </span>
        </div>
      </div>
    </div>
  );
};
