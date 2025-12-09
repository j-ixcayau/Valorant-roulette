import { cn } from "@/lib/utils";

export const ValorantIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 128 128"
    className={cn("fill-current", className)}
  >
    <path d="M49.2 24.31H34.96L19.2 92.44h14.71l3.52-17.58h18.43l3.52 17.58h14.71L49.2 24.31zM38.11 63.58l6.16-30.77 6.16 30.77H38.11zM78.69 24.31l14.75 35.39L108.19 24.3h15.22v68.13H109.7v-38.3l-12.7 30.46h-8.12l-12.7-30.46v38.3H63.47V24.31h15.22z"></path>
  </svg>
);
