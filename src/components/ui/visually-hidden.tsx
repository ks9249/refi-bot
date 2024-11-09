import * as React from "react"

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
        {...props}
      >
        {children}
      </span>
    )
  }
)
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }