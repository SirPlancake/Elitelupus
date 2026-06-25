import {createContext, type ReactNode, useContext, useLayoutEffect} from "react";

type LayoutTopbarContextValue = {
  setTopbarContent: (Content: ReactNode) => void;
  setTopbarHidden: (Hidden: boolean) => void;
};

export const LayoutTopbarContext = createContext<LayoutTopbarContextValue | null>(null);

export function useLayoutTopbar(Content: ReactNode, Hidden = false) {
  const Context = useContext(LayoutTopbarContext);

  useLayoutEffect(() => {
    if (!Context) return;

    Context.setTopbarContent(Content);
    Context.setTopbarHidden(Hidden);

    return () => {
      Context.setTopbarContent(null);
      Context.setTopbarHidden(false);
    };
  }, [Context, Content, Hidden]);
}
