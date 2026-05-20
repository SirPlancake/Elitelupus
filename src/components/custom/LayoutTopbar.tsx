import {createContext, type ReactNode, useContext, useLayoutEffect} from "react";

type LayoutTopbarContextValue = {
  setTopbarContent: (Content: ReactNode) => void;
};

export const LayoutTopbarContext = createContext<LayoutTopbarContextValue | null>(null);

export function useLayoutTopbar(Content: ReactNode) {
  const Context = useContext(LayoutTopbarContext);

  useLayoutEffect(() => {
    if (!Context) return;

    Context.setTopbarContent(Content);

    return () => {
      Context.setTopbarContent(null);
    };
  }, [Context, Content]);
}
