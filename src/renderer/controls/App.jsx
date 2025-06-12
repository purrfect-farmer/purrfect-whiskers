import Icon from "../src/assets/images/icon.png";

export default function App() {
  return (
    <div className="border-r w-screen h-screen p-2 flex flex-col gap-2 items-center">
      {/* Accounts Dialog */}
      <button className="p-2 text-orange-500">
        <svg
          className="size-5"
          dataSlot="icon"
          fill="none"
          strokeWidth={1.5}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Details Button */}
      <button className="mt-auto size-10 relative flex">
        <img src={Icon} alt="Purrfect Whiskers" className="size-full " />
      </button>

      {/* Reload */}
      <button
        title="Reload App"
        className="p-2 text-orange-500"
        onClick={() => window.location.reload()}
      >
        <svg
          className="size-5"
          dataSlot="icon"
          fill="none"
          strokeWidth={1.5}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>
  );
}
