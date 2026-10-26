/** A display of the Spider wallet balance */
export default function SpiderBalanceDisplay({ query }) {
  /** The wallet balance */
  const balance = query.data?.wallet || 0;

  return (
    <div className="text-center">
      {query.isPending ? (
        "Loading balance..."
      ) : query.isError ? (
        "Error fetching balance."
      ) : (
        <span className="text-green-500">
          Available Balance: <strong>${parseFloat(balance).toFixed(3)}</strong>
        </span>
      )}
    </div>
  );
}
