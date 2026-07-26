type PixelIconName =
  | "brand"
  | "favorites"
  | "gamepad"
  | "logs"
  | "profile"
  | "vault";

type PixelIconProps = React.SVGProps<SVGSVGElement> & {
  name: PixelIconName;
};

const sharedProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "square",
  strokeLinejoin: "miter",
  strokeWidth: 1.8,
  vectorEffect: "non-scaling-stroke",
} as const;

export function PixelIcon({ name, ...props }: PixelIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      {...props}
    >
      {name === "brand" && (
        <>
          <path
            fill="currentColor"
            d="M11 3h2v2h-2zM9 5h2v2H9zM13 5h2v2h-2zM7 7h2v2H7zM15 7h2v2h-2zM5 9h2v2H5zM17 9h2v2h-2zM3 11h2v2H3zM19 11h2v2h-2zM5 13h2v2H5zM17 13h2v2h-2zM7 15h2v2H7zM15 15h2v2h-2zM9 17h2v2H9zM13 17h2v2h-2zM11 19h2v2h-2z"
          />
          <path fill="currentColor" d="M10 9h4v2h-4zM8 11h8v2H8zM10 13h4v2h-4z" opacity="0.3" />
        </>
      )}

      {name === "gamepad" && (
        <>
          <path
            {...sharedProps}
            d="M7 9h10l3 2.5v5L18 19h-3l-2-2h-2l-2 2H6l-2-2.5v-5z"
          />
          <path {...sharedProps} d="M7.5 13h4M9.5 11v4" />
          <path fill="currentColor" d="M15 12h2v2h-2zM17 14h2v2h-2z" />
          <path fill="currentColor" d="M7 9h2v2H7zM15 17h3v2h-3z" opacity="0.28" />
        </>
      )}

      {name === "favorites" && (
        <>
          <path {...sharedProps} d="M7 5h4v2h2V5h4v2h2v5h-2v3h-2v2h-2v2h-2v-2H9v-2H7v-3H5V7h2z" />
          <path fill="currentColor" d="M7 7h4v3h2V7h4v5h-2v3h-2v2h-2v-2H9v-3H7z" opacity="0.22" />
        </>
      )}

      {name === "logs" && (
        <>
          <path {...sharedProps} d="M6 3h8l4 4v14H6zM14 3v4h4" />
          <path fill="currentColor" d="M8 10h2v2H8zM8 14h2v2H8z" />
          <path {...sharedProps} d="M12 11h4M12 15h4" />
        </>
      )}

      {name === "profile" && (
        <>
          <circle {...sharedProps} cx="12" cy="8" r="3" />
          <path {...sharedProps} d="M6 19v-2.5c0-2.5 2.5-4.5 6-4.5s6 2 6 4.5V19z" />
          <path fill="currentColor" d="M9 15h6v2H9z" opacity="0.24" />
        </>
      )}

      {name === "vault" && (
        <>
          <path fill="currentColor" d="M12 5l5 6h-3v5h-4v-5H7z" />
          <path {...sharedProps} d="M5 16v4h14v-4" />
        </>
      )}
    </svg>
  );
}
